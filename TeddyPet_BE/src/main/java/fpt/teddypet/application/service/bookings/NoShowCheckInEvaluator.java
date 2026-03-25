package fpt.teddypet.application.service.bookings;

import fpt.teddypet.domain.entity.NoShowConfig;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Đánh giá no-show khi check-in: T0 do {@link NoShowAppointmentStartResolver} cung cấp
 * (khách sạn: ngày + giờ mở cửa; dịch vụ khung giờ: giờ bắt đầu slot đã chọn).
 */
public final class NoShowCheckInEvaluator {

    public static final LocalTime DEFAULT_SHOP_OPEN = LocalTime.of(8, 0);

    public enum Outcome {
        /** Trong cửa sổ đến muộn được phép hoặc đúng giờ */
        ON_TIME_OR_LATE_OK,
        /** Trễ so với giờ hẹn nhưng chưa vượt grace → chỉ audit */
        LATE_BEFORE_NO_SHOW,
        /** Vượt grace → no-show, có thể áp phạt */
        NO_SHOW,
        /** Không áp dụng (không config / không có ngày) */
        SKIPPED
    }

    public record LineResult(
            Long bookingPetServiceId,
            String serviceCode,
            String serviceName,
            LocalDateTime appointmentStart,
            Outcome outcome,
            BigDecimal penaltyApplied,
            String note
    ) {}

    private NoShowCheckInEvaluator() {}

    /**
     * @param checkInAt         thời điểm check-in thực tế
     * @param appointmentStart  T0 — thời điểm bắt đầu tính no-show (đã resolve: giờ mở cửa hoặc đầu khung giờ)
     * @param cfg               cấu hình no-show của dịch vụ (nullable → SKIPPED)
     */
    public static LineResult evaluateLine(
            LocalDateTime checkInAt,
            LocalDateTime appointmentStart,
            NoShowConfig cfg,
            Long bookingPetServiceId,
            String serviceCode,
            String serviceName
    ) {
        if (cfg == null || cfg.isDeleted() || !cfg.isActive()) {
            return skipped(bookingPetServiceId, serviceCode, serviceName, "Không có cấu hình no-show hoạt động.");
        }
        if (appointmentStart == null) {
            return skipped(bookingPetServiceId, serviceCode, serviceName, "Thiếu thời điểm hẹn (ngày gửi / khung giờ).");
        }
        LocalDateTime t0 = appointmentStart;

        int graceMin = cfg.getGracePeriodMinutes() != null ? cfg.getGracePeriodMinutes() : 0;
        boolean allowLate = Boolean.TRUE.equals(cfg.getAllowLateCheckin());
        int lateMin = cfg.getLateCheckinMinutes() != null ? cfg.getLateCheckinMinutes() : 0;

        LocalDateTime graceEnd = t0.plusMinutes(graceMin);
        BigDecimal penaltyCfg = cfg.getPenaltyAmount() != null ? cfg.getPenaltyAmount() : BigDecimal.ZERO;

        Outcome outcome;
        String note;

        if (allowLate) {
            LocalDateTime lateEnd = t0.plusMinutes(lateMin);
            if (!checkInAt.isAfter(lateEnd)) {
                outcome = Outcome.ON_TIME_OR_LATE_OK;
                note = "Trong thời gian cho phép check-in muộn (≤ " + lateMin + " phút sau thời điểm hẹn).";
            } else if (!checkInAt.isAfter(graceEnd)) {
                outcome = Outcome.LATE_BEFORE_NO_SHOW;
                note = "Đến muộn sau khung cho phép nhưng chưa vượt thời gian chờ (grace).";
            } else {
                outcome = Outcome.NO_SHOW;
                note = "Vượt thời gian chờ (grace) — coi là no-show.";
            }
        } else {
            if (!checkInAt.isAfter(t0)) {
                outcome = Outcome.ON_TIME_OR_LATE_OK;
                note = "Đúng hoặc trước thời điểm hẹn.";
            } else if (!checkInAt.isAfter(graceEnd)) {
                outcome = Outcome.LATE_BEFORE_NO_SHOW;
                note = "Đến muộn sau thời điểm hẹn nhưng chưa vượt thời gian chờ (grace).";
            } else {
                outcome = Outcome.NO_SHOW;
                note = "Vượt thời gian chờ (grace) — coi là no-show.";
            }
        }

        BigDecimal penaltyApplied = BigDecimal.ZERO;
        if (outcome == Outcome.NO_SHOW && penaltyCfg.compareTo(BigDecimal.ZERO) > 0) {
            penaltyApplied = penaltyCfg;
        }

        return new LineResult(
                bookingPetServiceId,
                serviceCode,
                serviceName,
                t0,
                outcome,
                penaltyApplied,
                note
        );
    }

    private static LineResult skipped(Long bpsId, String code, String name, String reason) {
        return new LineResult(
                bpsId,
                code,
                name,
                null,
                Outcome.SKIPPED,
                BigDecimal.ZERO,
                reason
        );
    }
}

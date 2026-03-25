package fpt.teddypet.application.service.bookings;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.port.output.shop.ShopOperationHourRepositoryPort;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingNoShowEvaluation;
import fpt.teddypet.domain.entity.BookingPet;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.NoShowConfig;
import fpt.teddypet.domain.entity.ShopOperationHour;
import fpt.teddypet.domain.enums.bookings.BookingTypeEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingNoShowEvaluationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Áp dụng đánh giá no-show khi check-in: lưu audit + cộng phạt vào tổng tiền booking (nếu có).
 */
@Service
@RequiredArgsConstructor
public class BookingNoShowCheckInService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper().findAndRegisterModules();

    private final BookingNoShowEvaluationRepository bookingNoShowEvaluationRepository;
    private final ShopOperationHourRepositoryPort shopOperationHourRepositoryPort;
    private final NoShowAppointmentStartResolver noShowAppointmentStartResolver;

    /**
     * @return tổng phạt đã áp (để caller cộng vào {@code booking.totalAmount})
     */
    public BigDecimal evaluateAndPersist(Booking booking, LocalDateTime checkInAt) {
        Long bookingId = booking.getId();
        if (bookingId == null || bookingNoShowEvaluationRepository.existsByBookingIdAndIsDeletedFalse(bookingId)) {
            return BigDecimal.ZERO;
        }
        /** Đặt tại quầy: không áp dụng phạt / đánh giá no-show khi check-in. */
        if (booking.getBookingType() == BookingTypeEnum.WALK_IN) {
            return BigDecimal.ZERO;
        }

        List<NoShowCheckInEvaluator.LineResult> lines = new ArrayList<>();
        BigDecimal totalPenalty = BigDecimal.ZERO;

        for (BookingPet pet : booking.getPets()) {
            if (pet == null || pet.getServices() == null) {
                continue;
            }
            for (BookingPetService bps : pet.getServices()) {
                if (bps == null || !bps.isActive() || "CANCELLED".equalsIgnoreCase(bps.getStatus())) {
                    continue;
                }
                fpt.teddypet.domain.entity.Service svc = bps.getService();
                if (svc == null) {
                    continue;
                }
                NoShowConfig cfg = svc.getNoShowConfig();
                if (cfg == null || cfg.isDeleted() || !cfg.isActive()) {
                    continue;
                }
                LocalDate est = bps.getEstimatedCheckInDate();
                LocalTime shopOpen = resolveShopOpen(est);
                LocalDateTime appointmentStart = noShowAppointmentStartResolver.resolve(bps, svc, shopOpen);
                NoShowCheckInEvaluator.LineResult line = NoShowCheckInEvaluator.evaluateLine(
                        checkInAt,
                        appointmentStart,
                        cfg,
                        bps.getId(),
                        svc.getCode(),
                        svc.getServiceName());
                lines.add(line);
                if (line.penaltyApplied() != null) {
                    totalPenalty = totalPenalty.add(line.penaltyApplied());
                }
            }
        }

        if (lines.isEmpty()) {
            return BigDecimal.ZERO;
        }

        String detailJson;
        try {
            detailJson = OBJECT_MAPPER.writeValueAsString(lines);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Không thể serialize no-show evaluation", e);
        }

        BookingNoShowEvaluation entity = BookingNoShowEvaluation.builder()
                .bookingId(bookingId)
                .checkInAt(checkInAt)
                .evaluatedAt(LocalDateTime.now())
                .totalPenaltyApplied(totalPenalty)
                .detailJson(detailJson)
                .build();

        bookingNoShowEvaluationRepository.save(entity);
        return totalPenalty;
    }

    /**
     * Giờ mở cửa theo thứ trong tuần; nếu nghỉ / không cấu hình → 08:00.
     */
    private LocalTime resolveShopOpen(LocalDate serviceDate) {
        if (serviceDate == null) {
            return NoShowCheckInEvaluator.DEFAULT_SHOP_OPEN;
        }
        int dow = serviceDate.getDayOfWeek().getValue();
        return shopOperationHourRepositoryPort
                .findByDayOfWeek(dow)
                .filter(h -> !Boolean.TRUE.equals(h.getIsDayOff()))
                .map(ShopOperationHour::getOpenTime)
                .filter(java.util.Objects::nonNull)
                .orElse(NoShowCheckInEvaluator.DEFAULT_SHOP_OPEN);
    }
}

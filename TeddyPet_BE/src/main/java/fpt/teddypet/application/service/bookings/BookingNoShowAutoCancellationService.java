package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.port.output.shop.ShopOperationHourRepositoryPort;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPet;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.domain.entity.NoShowConfig;
import fpt.teddypet.domain.entity.ShopOperationHour;
import fpt.teddypet.domain.enums.bookings.BookingTypeEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Hủy booking tự động khi cấu hình no-show bật {@code autoMarkNoShow} và đã quá thời điểm T0 + grace mà chưa check-in.
 * Không áp dụng cho {@link BookingTypeEnum#WALK_IN}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingNoShowAutoCancellationService {

    private static final ZoneId SHOP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final BookingRepository bookingRepository;
    private final ShopOperationHourRepositoryPort shopOperationHourRepositoryPort;
    private final BookingNoShowCancellationExecutor bookingNoShowCancellationExecutor;
    private final NoShowAppointmentStartResolver noShowAppointmentStartResolver;

    /**
     * @return true nếu đã hủy booking
     */
    @Transactional
    public boolean processBookingIfNoShowOverdue(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null || booking.isDeleted()) {
            return false;
        }
        if (booking.getBookingType() == BookingTypeEnum.WALK_IN) {
            return false;
        }
        String st = booking.getStatus() != null ? booking.getStatus().toUpperCase() : "";
        if (!List.of("PENDING", "CONFIRMED", "READY").contains(st)) {
            return false;
        }
        if (booking.getBookingCheckInDate() != null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now(SHOP_ZONE);
        List<String> triggerDetails = new ArrayList<>();
        boolean shouldCancel = false;

        for (BookingPet pet : booking.getPets()) {
            if (pet == null || pet.getServices() == null) {
                continue;
            }
            for (BookingPetService bps : pet.getServices()) {
                if (bps == null || !bps.isActive() || "CANCELLED".equalsIgnoreCase(bps.getStatus())) {
                    continue;
                }
                if (bps.getService() == null) {
                    continue;
                }
                NoShowConfig cfg = bps.getService().getNoShowConfig();
                if (cfg == null || cfg.isDeleted() || !cfg.isActive()) {
                    continue;
                }
                if (!Boolean.TRUE.equals(cfg.getAutoMarkNoShow())) {
                    continue;
                }
                LocalDate est = bps.getEstimatedCheckInDate();
                LocalDateTime t0 = noShowAppointmentStartResolver.resolve(bps, bps.getService(), resolveShopOpen(est));
                if (t0 == null) {
                    continue;
                }
                int grace = cfg.getGracePeriodMinutes() != null ? cfg.getGracePeriodMinutes() : 0;
                LocalDateTime graceEnd = t0.plusMinutes(grace);
                if (now.isAfter(graceEnd)) {
                    shouldCancel = true;
                    triggerDetails.add(String.format(
                            "Dịch vụ \"%s\": đã quá %d phút sau giờ hẹn (%s %s, cấu hình \"%s\").",
                            bps.getService().getServiceName(),
                            grace,
                            t0.toLocalDate().format(DATE_FMT),
                            t0.toLocalTime(),
                            cfg.getName()));
                }
            }
        }

        if (!shouldCancel) {
            return false;
        }

        String reason = "Đơn đặt lịch bị hủy tự động do không đến (no-show) sau thời gian chờ theo quy định của cửa hàng.\n"
                + String.join("\n", triggerDetails);

        bookingNoShowCancellationExecutor.cancelBookingForNoShow(booking, "SYSTEM_NO_SHOW", reason);
        log.info("Booking {} auto-cancelled for no-show (SYSTEM_NO_SHOW)", booking.getBookingCode());
        return true;
    }

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

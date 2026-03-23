package fpt.teddypet.application.service.bookings;

import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.service.dashboard.DashboardService;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingPet;
import fpt.teddypet.domain.entity.BookingPetService;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.TimeSlotBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Hủy booking với lý do no-show (dùng chung cho job tự động và thao tác thủ công của nhân viên).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingNoShowCancellationExecutor {

    private static final ZoneId SHOP_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final BookingRepository bookingRepository;
    private final BookingDepositRepository bookingDepositRepository;
    private final TimeSlotBookingRepository timeSlotBookingRepository;
    private final BookingHoldReleaseService bookingHoldReleaseService;
    private final EmailServicePort emailServicePort;
    private final @Lazy DashboardService dashboardService;

    @Transactional
    public void cancelBookingForNoShow(Booking booking, String cancelledBy, String reason) {
        if (booking == null || booking.getId() == null) {
            throw new IllegalArgumentException("Booking không hợp lệ.");
        }

        booking.setStatus("CANCELLED");
        booking.setCancelRequested(false);
        booking.setCancelledAt(LocalDateTime.now(SHOP_ZONE));
        booking.setCancelledBy(cancelledBy);
        booking.setCancelledReason(reason);

        for (BookingPet pet : booking.getPets()) {
            if (pet == null) {
                continue;
            }
            pet.setStatus("CANCELLED");
            if (pet.getServices() == null) {
                continue;
            }
            for (BookingPetService svc : pet.getServices()) {
                if (svc != null) {
                    svc.setStatus("CANCELLED");
                }
            }
        }

        bookingDepositRepository.findByBookingId(booking.getId()).forEach(deposit -> {
            if ("PENDING".equals(deposit.getStatus())) {
                String holdPayloadJson = deposit.getHoldPayloadJson();
                deposit.setStatus("CANCELLED");
                bookingDepositRepository.save(deposit);
                bookingHoldReleaseService.releaseFromJson(holdPayloadJson);
            }
        });

        timeSlotBookingRepository.deleteByBookingPetService_Booking_Id(booking.getId());
        bookingRepository.save(booking);

        if (booking.getCustomerEmail() != null && !booking.getCustomerEmail().isBlank()) {
            try {
                emailServicePort.sendBookingCancelledEmail(
                        booking.getCustomerEmail().trim(),
                        booking.getBookingCode(),
                        reason);
            } catch (Exception e) {
                log.warn("No-show cancel: failed to send email for booking {}", booking.getBookingCode(), e);
            }
        }

        try {
            dashboardService.sendDashboardUpdate();
        } catch (Exception e) {
            log.warn("Dashboard update after no-show cancel failed", e);
        }

        log.info("Booking {} cancelled for no-show (by {})", booking.getBookingCode(), cancelledBy);
    }
}

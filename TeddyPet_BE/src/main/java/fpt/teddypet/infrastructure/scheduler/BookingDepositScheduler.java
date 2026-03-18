package fpt.teddypet.infrastructure.scheduler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.application.service.bookings.BookingHoldReleaseService;
import fpt.teddypet.domain.entity.*;
import fpt.teddypet.domain.enums.RoomStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.TimeSlotBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingDepositScheduler {

    private final BookingDepositRepository bookingDepositRepository;
    private final BookingRepository bookingRepository;
    private final RoomRepositoryPort roomRepositoryPort;
    private final TimeSlotRepositoryPort timeSlotRepositoryPort;
    private final TimeSlotBookingRepository timeSlotBookingRepository;
    private final ObjectMapper objectMapper;
    private final EmailServicePort emailServicePort;
    private final BookingHoldReleaseService bookingHoldReleaseService;

    /** Chạy mỗi 30s để nhả giữ chỗ quá 5 phút. */
    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void expirePendingDepositsAndReleaseHolds() {
        LocalDateTime now = LocalDateTime.now();
        List<BookingDeposit> expired = bookingDepositRepository.findExpiredByStatus("PENDING", now);
        if (expired.isEmpty())
            return;

        log.info("Found {} expired booking deposits to release", expired.size());

        for (BookingDeposit d : expired) {
            try {
                String payloadJson = d.getHoldPayloadJson();
                if (payloadJson != null && !payloadJson.isBlank()) {
                    JsonNode payload = objectMapper.readTree(payloadJson);
                    bookingHoldReleaseService.releaseHolds(payload);
                }
                d.setStatus("EXPIRED");
                bookingDepositRepository.save(d);

                // Nếu có booking tạm thời gắn với giữ chỗ này thì hủy luôn booking đó
                if (d.getBookingId() != null) {
                    Booking booking = bookingRepository.findById(d.getBookingId()).orElse(null);
                    if (booking != null && Boolean.TRUE.equals(booking.getIsTemporary())) {
                        booking.setStatus("CANCELLED");
                        booking.setCancelledAt(LocalDateTime.now());
                        booking.setCancelledBy("SYSTEM");
                        booking.setCancelledReason("Deposit expired");
                        booking.setIsTemporary(false);
                        // Set status CANCELLED for all associated pet services and pets
                        for (BookingPet pet : booking.getPets()) {
                            pet.setStatus("CANCELLED");
                            for (BookingPetService svc : pet.getServices()) {
                                svc.setStatus("CANCELLED");
                            }
                        }
                        bookingRepository.save(booking);

                        // Xóa TimeSlotBooking records liên quan đến booking này
                        timeSlotBookingRepository.deleteByBookingPetService_Booking_Id(booking.getId());

                        // Gửi email thông báo giữ chỗ hết hạn
                        if (booking.getCustomerEmail() != null && !booking.getCustomerEmail().isBlank()) {
                            try {
                                emailServicePort.sendBookingDepositExpiredEmail(
                                        booking.getCustomerEmail(), booking.getBookingCode());
                            } catch (Exception emailEx) {
                                log.warn("Failed to send deposit-expired email for booking {}", booking.getBookingCode(), emailEx);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to release holds for deposit {}", d.getId(), e);
            }
        }
    }

    /**
     * Chạy mỗi 60s để nhắc nhở những đơn có chưa quá 2 phút nữa hết hạn giữ chỗ (<=2 phút)
     */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void sendDepositReminders() {
        LocalDateTime threshold = LocalDateTime.now().plusMinutes(2); // <= 2 minutes left
        List<BookingDeposit> deposits = bookingDepositRepository.findPendingReminders("PENDING", threshold);
        if (deposits.isEmpty())
            return;

        for (BookingDeposit d : deposits) {
            try {
                if (d.getBookingId() != null) {
                    Booking booking = bookingRepository.findById(d.getBookingId()).orElse(null);
                    if (booking != null && booking.getCustomerEmail() != null
                            && !booking.getCustomerEmail().isBlank()) {
                        emailServicePort.sendBookingDepositReminderEmail(booking.getCustomerEmail(),
                                booking.getBookingCode());
                    }
                }
                d.setReminderSent(true);
                d.setReminderSentAt(LocalDateTime.now());
                bookingDepositRepository.save(d);
            } catch (Exception e) {
                log.error("Failed to send deposit reminder for deposit {}", d.getId(), e);
            }
        }
    }
}

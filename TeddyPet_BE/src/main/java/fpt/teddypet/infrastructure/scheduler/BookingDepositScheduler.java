package fpt.teddypet.infrastructure.scheduler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingDeposit;
import fpt.teddypet.domain.entity.Room;
import fpt.teddypet.domain.entity.TimeSlot;
import fpt.teddypet.domain.enums.RoomStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRepository;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingRepository;
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
    private final ObjectMapper objectMapper;

    /** Chạy mỗi 30s để nhả giữ chỗ quá 5 phút. */
    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void expirePendingDepositsAndReleaseHolds() {
        LocalDateTime now = LocalDateTime.now();
        List<BookingDeposit> expired = bookingDepositRepository.findExpiredByStatus("PENDING", now);
        if (expired.isEmpty()) return;

        log.info("Found {} expired booking deposits to release", expired.size());

        for (BookingDeposit d : expired) {
            try {
                String payloadJson = d.getHoldPayloadJson();
                if (payloadJson != null && !payloadJson.isBlank()) {
                    JsonNode payload = objectMapper.readTree(payloadJson);
                    releaseHolds(payload);
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
                        bookingRepository.save(booking);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to release holds for deposit {}", d.getId(), e);
            }
        }
    }

    private void releaseHolds(JsonNode holdPayload) {
        if (holdPayload == null || holdPayload.isNull()) return;

        JsonNode rooms = holdPayload.get("rooms");
        if (rooms != null && rooms.isArray()) {
            for (JsonNode n : rooms) {
                if (n == null || n.isNull()) continue;
                Long roomId = n.asLong();
                try {
                    Room room = roomRepositoryPort.findById(roomId).orElse(null);
                    if (room == null) continue;
                    if (room.getStatus() == RoomStatusEnum.OCCUPIED) {
                        room.setStatus(RoomStatusEnum.AVAILABLE);
                        roomRepositoryPort.save(room);
                    }
                } catch (Exception ignored) {
                    // best-effort
                }
            }
        }

        JsonNode timeSlots = holdPayload.get("timeSlots");
        if (timeSlots != null && timeSlots.isArray()) {
            for (JsonNode n : timeSlots) {
                if (n == null || n.isNull()) continue;
                Long slotId = n.asLong();
                try {
                    TimeSlot slot = timeSlotRepositoryPort.findById(slotId).orElse(null);
                    if (slot == null) continue;
                    int current = slot.getCurrentBookings() != null ? slot.getCurrentBookings() : 0;
                    if (current > 0) {
                        slot.setCurrentBookings(current - 1);
                        timeSlotRepositoryPort.save(slot);
                    }
                } catch (Exception ignored) {
                    // best-effort
                }
            }
        }
    }
}


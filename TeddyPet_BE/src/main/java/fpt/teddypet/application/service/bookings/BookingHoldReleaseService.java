package fpt.teddypet.application.service.bookings;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.application.port.output.shop.TimeSlotRepositoryPort;
import fpt.teddypet.domain.entity.Room;
import fpt.teddypet.domain.entity.TimeSlot;
import fpt.teddypet.domain.enums.RoomStatusEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookingHoldReleaseService {

    private final RoomRepositoryPort roomRepositoryPort;
    private final TimeSlotRepositoryPort timeSlotRepositoryPort;
    private final ObjectMapper objectMapper;

    @Transactional
    public void releaseFromJson(String holdPayloadJson) {
        if (holdPayloadJson == null || holdPayloadJson.isBlank()) {
            return;
        }
        try {
            JsonNode payload = objectMapper.readTree(holdPayloadJson);
            releaseHolds(payload);
        } catch (Exception ignored) {
            // best-effort: nếu payload lỗi thì bỏ qua, không phá luồng cancel
        }
    }

    @Transactional
    public void releaseHolds(JsonNode holdPayload) {
        if (holdPayload == null || holdPayload.isNull()) {
            return;
        }

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


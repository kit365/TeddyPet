package fpt.teddypet.application.dto.response.room;

import java.time.LocalDateTime;

public record RoomBlockingResponse(
        Long id,
        Long roomId,
        String roomNumber,
        String blockReason,
        LocalDateTime blockedFrom,
        LocalDateTime blockedTo,
        String blockedBy,
        LocalDateTime createdAt,
        String createdBy
) {
}

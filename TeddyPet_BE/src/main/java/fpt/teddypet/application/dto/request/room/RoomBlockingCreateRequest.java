package fpt.teddypet.application.dto.request.room;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record RoomBlockingCreateRequest(
        @NotNull(message = "ID phòng là bắt buộc")
        Long roomId,
        @Size(max = 2000)
        String blockReason,
        @NotNull(message = "Thời điểm bắt đầu khóa là bắt buộc")
        LocalDateTime blockedFrom,
        @NotNull(message = "Thời điểm kết thúc khóa là bắt buộc")
        LocalDateTime blockedTo,
        @Size(max = 255)
        String blockedBy
) {
}

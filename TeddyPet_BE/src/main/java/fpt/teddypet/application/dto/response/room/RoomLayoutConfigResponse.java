package fpt.teddypet.application.dto.response.room;

import java.time.LocalDateTime;

public record RoomLayoutConfigResponse(
        Long id,
        String layoutName,
        String block,
        Integer maxRows,
        Integer maxCols,
        String backgroundImage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

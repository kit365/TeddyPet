package fpt.teddypet.application.dto.response.room;

import java.time.LocalDateTime;

public record RoomLayoutConfigResponse(
        Long id,
        String layoutName,
        Integer maxRows,
        Integer maxCols,
        String backgroundImage,
        String status,
        Long serviceId,
        String serviceName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}

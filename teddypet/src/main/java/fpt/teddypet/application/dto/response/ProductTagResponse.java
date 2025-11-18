package fpt.teddypet.application.dto.response;

import java.time.LocalDateTime;

public record ProductTagResponse(
        Long tagId,
        String name,
        String description,
        String color,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}


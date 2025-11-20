package fpt.teddypet.application.dto.response.product.agerange;

import java.time.LocalDateTime;

public record ProductAgeRangeResponse(
        Long ageRangeId,
        String name,
        String description,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}


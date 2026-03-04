package fpt.teddypet.application.dto.response.amenity;

import java.time.LocalDateTime;

public record AmenityCategoryResponse(
        Long id,
        String categoryName,
        String description,
        Integer displayOrder,
        String icon,
        Boolean isActive,
        Boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

package fpt.teddypet.application.dto.response.amenity;

import java.time.LocalDateTime;

public record AmenityResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String description,
        String icon,
        String image,
        Integer displayOrder,
        Boolean isActive,
        Boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

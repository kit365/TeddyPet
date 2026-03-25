package fpt.teddypet.application.dto.response.product.image;

import java.time.LocalDateTime;

public record ProductImageResponse(
        Long imageId,
        Long productId,
        String imageUrl,
        String altText,
        Integer displayOrder,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}


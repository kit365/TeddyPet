package fpt.teddypet.application.dto.response.product.category;

import java.time.LocalDateTime;

public record ProductCategoryResponse(
        Long categoryId,
        String name,
        String description,
        String imageUrl,
        String altImage,
        Long parentId,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}


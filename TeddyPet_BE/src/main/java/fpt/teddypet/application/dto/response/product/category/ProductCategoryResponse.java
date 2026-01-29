package fpt.teddypet.application.dto.response.product.category;

import java.time.LocalDateTime;

public record ProductCategoryResponse(
        Long categoryId,
        String name,
        String slug,
        String description,
        String imageUrl,
        String altImage,
        Long parentId,
        String parentName,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy) {
}

package fpt.teddypet.application.dto.response.blog.category;

import java.time.LocalDateTime;

public record BlogCategoryResponse(
        Long categoryId,
        String name,
        String slug,
        String description,
        String imageUrl,
        String altImage,
        Long parentId,
        Integer displayOrder,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}

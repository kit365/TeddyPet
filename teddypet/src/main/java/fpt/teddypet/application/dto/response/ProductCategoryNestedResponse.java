package fpt.teddypet.application.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record ProductCategoryNestedResponse(
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
        String updatedBy,
        List<ProductCategoryNestedResponse> children
) {
}


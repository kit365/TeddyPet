package fpt.teddypet.application.dto.response.blog.category;

import com.fasterxml.jackson.annotation.JsonProperty;
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
        @JsonProperty("isActive")
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}

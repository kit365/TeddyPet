package fpt.teddypet.application.dto.response.blog.category;

import com.fasterxml.jackson.annotation.JsonProperty;

public record BlogCategoryInfo(
        Long categoryId,
        String name,
        String slug,
        String imageUrl,
        String altImage,
        Integer displayOrder,
        @JsonProperty("isActive")
        boolean isActive
) {
}

package fpt.teddypet.application.dto.response.blog.category;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record BlogCategoryNestedResponse(
        Long categoryId,
        String name,
        String slug,
        String imageUrl,
        String altImage,
        Integer displayOrder,
        @JsonProperty("isActive")
        boolean isActive,
        List<BlogCategoryNestedResponse> children
) {
}

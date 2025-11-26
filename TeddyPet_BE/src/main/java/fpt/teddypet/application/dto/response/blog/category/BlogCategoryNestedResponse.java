package fpt.teddypet.application.dto.response.blog.category;

import java.util.List;

public record BlogCategoryNestedResponse(
        Long categoryId,
        String name,
        String slug,
        String imageUrl,
        String altImage,
        Integer displayOrder,
        List<BlogCategoryNestedResponse> children
) {
}

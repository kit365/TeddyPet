package fpt.teddypet.application.dto.response.blog.category;

public record BlogCategoryInfo(
        Long categoryId,
        String name,
        String slug,
        String imageUrl,
        String altImage,
        Integer displayOrder
) {
}

package fpt.teddypet.application.dto.response.blog.post;

import fpt.teddypet.application.dto.response.blog.category.BlogCategoryInfo;
import fpt.teddypet.domain.enums.BlogPostStatusEnum;

import java.time.LocalDateTime;

public record BlogPostListResponse(
        Long id,
        String title,
        String slug,
        String excerpt,
        String featuredImage,
        String altImage,
        Integer viewCount,
        BlogPostStatusEnum status,
        BlogCategoryInfo category,
        Integer displayOrder,
        LocalDateTime createdAt
) {
}

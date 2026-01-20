package fpt.teddypet.application.dto.response.blog.post;

import com.fasterxml.jackson.annotation.JsonProperty;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryInfo;
import fpt.teddypet.application.dto.response.blog.tag.BlogTagInfo;
import fpt.teddypet.domain.enums.BlogPostStatusEnum;

import java.time.LocalDateTime;
import java.util.List;

public record BlogPostResponse(
        Long id,
        String title,
        String slug,
        String content,
        String excerpt,
        String featuredImage,
        String altImage,
        Integer viewCount,
        BlogPostStatusEnum status,
        BlogCategoryInfo category,
        List<BlogTagInfo> tags,
        Long parentId,
        Integer displayOrder,
        String metaTitle,
        String metaDescription,
        @JsonProperty("isActive")
        boolean isActive,
        @JsonProperty("isDeleted")
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}

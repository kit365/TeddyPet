package fpt.teddypet.application.dto.request.blogs.post;

import fpt.teddypet.domain.enums.BlogPostStatusEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BlogPostUpdateRequest(
        @NotBlank(message = "Tiêu đề bài viết là bắt buộc")
        @Size(max = 200, message = "Tiêu đề không được vượt quá 200 ký tự")
        String title,
        
        String content,
        
        @Size(max = 500, message = "Tóm tắt không được vượt quá 500 ký tự")
        String excerpt,
        
        @Size(max = 500, message = "URL hình ảnh đại diện không được vượt quá 500 ký tự")
        String featuredImage,
        
        Long categoryId,
        
        List<Long> tagIds,
        
        Long parentId, // For series
        
        BlogPostStatusEnum status,
        
        String metaTitle,
        
        String metaDescription,
        
        Integer displayOrder // Optional
) {
}

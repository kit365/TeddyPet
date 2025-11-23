package fpt.teddypet.application.dto.request.blogs.post;

import fpt.teddypet.domain.enums.BlogPostStatusEnum;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.time.LocalDateTime;

public record BlogPostSearchRequest(
        @Min(value = 0, message = "Page number must be greater than or equal to 0")
        Integer page,
        
        @Min(value = 1, message = "Page size must be greater than or equal to 1")
        @Max(value = 100, message = "Page size must be less than or equal to 100")
        Integer size,
        
        String keyword,
        
        String sortKey,
        
        String sortDirection,
        
        Long categoryId,
        
        Long tagId,
        
        BlogPostStatusEnum status,
        
        LocalDateTime createdAtFrom,
        
        LocalDateTime createdAtTo
) {
    public BlogPostSearchRequest {
        if (page == null) page = 0;
        if (size == null) size = 20;
    }
}

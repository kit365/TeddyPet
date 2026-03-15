package fpt.teddypet.application.dto.request.blogs.feedback;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BlogCommentRequest(
    @NotNull(message = "Blog post ID is required")
    Long blogPostId,
    
    @NotBlank(message = "Comment content cannot be empty")
    String content,
    
    Long parentId,
    
    String guestName,
    
    String guestEmail
) {
}

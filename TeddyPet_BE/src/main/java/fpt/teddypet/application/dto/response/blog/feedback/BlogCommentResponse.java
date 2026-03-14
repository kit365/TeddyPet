package fpt.teddypet.application.dto.response.blog.feedback;

import java.time.LocalDateTime;
import java.util.List;

public record BlogCommentResponse(
    Long id,
    Long blogPostId,
    String userName,
    String guestName,
    String content,
    Long parentId,
    LocalDateTime createdAt,
    List<BlogCommentResponse> replies
) {
}

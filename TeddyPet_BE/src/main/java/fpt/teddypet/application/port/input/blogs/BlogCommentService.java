package fpt.teddypet.application.port.input.blogs;

import fpt.teddypet.application.dto.request.blogs.feedback.BlogCommentRequest;
import fpt.teddypet.application.dto.response.blog.feedback.BlogCommentResponse;

import java.util.List;

public interface BlogCommentService {
    BlogCommentResponse createComment(BlogCommentRequest request);
    List<BlogCommentResponse> getCommentsByBlogPostId(Long blogPostId);
    List<BlogCommentResponse> getAllComments();
    void deleteComment(Long commentId);
}

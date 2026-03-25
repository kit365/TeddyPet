package fpt.teddypet.application.service.blogs;

import fpt.teddypet.application.dto.request.blogs.feedback.BlogCommentRequest;
import fpt.teddypet.application.dto.response.blog.feedback.BlogCommentResponse;
import fpt.teddypet.application.port.input.blogs.BlogCommentService;
import fpt.teddypet.application.port.output.blogs.BlogCommentRepositoryPort;
import fpt.teddypet.application.port.output.blogs.BlogPostRepositoryPort;
import fpt.teddypet.application.util.SecurityUtil;
import fpt.teddypet.domain.entity.BlogComment;
import fpt.teddypet.domain.entity.BlogPost;
import fpt.teddypet.domain.entity.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlogCommentApplicationService implements BlogCommentService {

    private final BlogCommentRepositoryPort blogCommentRepositoryPort;
    private final BlogPostRepositoryPort blogPostRepositoryPort;

    @Override
    @Transactional
    public BlogCommentResponse createComment(BlogCommentRequest request) {
        BlogPost post = blogPostRepositoryPort.findById(request.blogPostId())
                .orElseThrow(() -> new EntityNotFoundException("Blog post not found"));

        BlogComment parent = null;
        if (request.parentId() != null) {
            parent = blogCommentRepositoryPort.findById(request.parentId())
                    .orElseThrow(() -> new EntityNotFoundException("Parent comment not found"));
        }

        UUID currentUserId = SecurityUtil.getCurrentUserIdOrNull();
        
        BlogComment comment = BlogComment.builder()
                .blogPost(post)
                .parent(parent)
                .content(request.content())
                .guestName(request.guestName())
                .guestEmail(request.guestEmail())
                .build();

        if (currentUserId != null) {
            User user = new User();
            user.setId(currentUserId);
            comment.setUser(user);
        }

        BlogComment saved = blogCommentRepositoryPort.save(comment);
        return mapToResponse(saved);
    }

    @Override
    public List<BlogCommentResponse> getCommentsByBlogPostId(Long blogPostId) {
        return blogCommentRepositoryPort.findByBlogPostIdAndParentIdIsNullOrderByCreatedAtDesc(blogPostId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<BlogCommentResponse> getAllComments() {
        return blogCommentRepositoryPort.findAllByParentIdIsNullOrderByCreatedAtDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId) {
        BlogComment comment = blogCommentRepositoryPort.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found"));
        blogCommentRepositoryPort.delete(comment);
    }

    private BlogCommentResponse mapToResponse(BlogComment comment) {
        List<BlogCommentResponse> replies = comment.getReplies() != null ? 
            comment.getReplies().stream().map(this::mapToResponse).collect(Collectors.toList()) : List.of();
            
        return new BlogCommentResponse(
                comment.getId(),
                comment.getBlogPost().getId(),
                comment.getUser() != null ? comment.getUser().getUsername() : null,
                comment.getGuestName(),
                comment.getContent(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                comment.getCreatedAt(),
                replies
        );
    }
}

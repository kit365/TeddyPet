package fpt.teddypet.presentation.controller.blog;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.blogs.feedback.BlogCommentRequest;
import fpt.teddypet.application.dto.response.blog.feedback.BlogCommentResponse;
import fpt.teddypet.application.port.input.blogs.BlogCommentService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_BLOG_COMMENTS)
@RequiredArgsConstructor
@Tag(name = "Blog Comment", description = "APIs for managing blog post comments")
public class BlogCommentController {

    private final BlogCommentService blogCommentService;

    @PostMapping
    @Operation(summary = "Create Blog Comment", description = "Creates a new comment on a blog post.")
    public ResponseEntity<ApiResponse<BlogCommentResponse>> createComment(@Valid @RequestBody BlogCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(blogCommentService.createComment(request)));
    }

    @GetMapping("/post/{postId}")
    @Operation(summary = "Get Blog Comments", description = "Retrieves all comments for a specific blog post.")
    public ResponseEntity<ApiResponse<List<BlogCommentResponse>>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(ApiResponse.success(blogCommentService.getCommentsByBlogPostId(postId)));
    }

    @GetMapping("/all")
    @Operation(summary = "Get All Blog Comments", description = "Retrieves all root comments for admin management.")
    public ResponseEntity<ApiResponse<List<BlogCommentResponse>>> getAllComments() {
        return ResponseEntity.ok(ApiResponse.success(blogCommentService.getAllComments()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Blog Comment", description = "Deletes a comment by its ID.")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long id) {
        blogCommentService.deleteComment(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

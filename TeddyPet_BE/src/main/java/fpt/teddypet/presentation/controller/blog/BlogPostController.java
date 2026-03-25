package fpt.teddypet.presentation.controller.blog;

import fpt.teddypet.application.constants.blogs.blogpost.BlogPostMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.request.blogs.post.BlogPostCreateRequest;
import fpt.teddypet.application.dto.request.blogs.post.BlogPostSearchRequest;
import fpt.teddypet.application.dto.request.blogs.post.BlogPostUpdateRequest;
import fpt.teddypet.application.dto.response.blog.post.BlogPostListResponse;
import fpt.teddypet.application.dto.response.blog.post.BlogPostResponse;
import fpt.teddypet.application.port.input.blogs.BlogPostService;
import fpt.teddypet.domain.enums.BlogPostStatusEnum;
import fpt.teddypet.presentation.constants.ApiConstants;
import fpt.teddypet.presentation.validation.RequestParamParser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_BLOG_POSTS)
@RequiredArgsConstructor
@Tag(name = "Blog Post", description = "APIs for managing blog posts")
public class BlogPostController {

    private final BlogPostService blogPostService;

    @PostMapping
    @Operation(summary = "Create Blog Post", description = "Creates a new blog post.")
    public ResponseEntity<ApiResponse<Void>> create(@Valid @RequestBody BlogPostCreateRequest request) {
        blogPostService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(BlogPostMessages.MESSAGE_BLOG_POST_CREATED_SUCCESS));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Blog Post", description = "Updates an existing blog post.")
    public ResponseEntity<ApiResponse<Void>> update(@PathVariable Long id, @Valid @RequestBody BlogPostUpdateRequest request) {
        blogPostService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(BlogPostMessages.MESSAGE_BLOG_POST_UPDATED_SUCCESS));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Blog Post by ID", description = "Retrieves a blog post by its ID.")
    public ResponseEntity<ApiResponse<BlogPostResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(blogPostService.getPostDetail(id)));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get Blog Post by Slug", description = "Retrieves a blog post by its slug.")
    public ResponseEntity<ApiResponse<BlogPostResponse>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(blogPostService.getPostBySlug(slug)));
    }

    @GetMapping
    @Operation(summary = "Get All Blog Posts (Paged)", description = "Retrieves a paged list of blog posts with filtering.")
    public ResponseEntity<ApiResponse<PageResponse<BlogPostListResponse>>> getAllPaged(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sortKey,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) BlogPostStatusEnum status,
            @RequestParam(required = false) String createdAtFrom,
            @RequestParam(required = false) String createdAtTo
    ) {
        LocalDateTime from = RequestParamParser.parseLocalDateTime(createdAtFrom, false);
        LocalDateTime to = RequestParamParser.parseLocalDateTime(createdAtTo, true);

        BlogPostSearchRequest request = new BlogPostSearchRequest(
                page, size, keyword, sortKey, sortDirection,
                categoryId, tagId, status, from, to
        );

        return ResponseEntity.ok(ApiResponse.success(blogPostService.getAllPaged(request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Blog Post", description = "Soft deletes a blog post.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        blogPostService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(BlogPostMessages.MESSAGE_BLOG_POST_DELETED_SUCCESS));
    }

    @PostMapping("/{id}/view")
    @Operation(summary = "Increment View Count", description = "Increments the view count of a blog post.")
    public ResponseEntity<ApiResponse<Void>> incrementViewCount(@PathVariable Long id) {
        blogPostService.incrementViewCount(id);
        return ResponseEntity.ok(ApiResponse.success((Void) null));
    }

    @GetMapping("/status")
    @Operation(summary = "Get Blog Post Statuses", description = "Retrieves a list of all blog post statuses.")
    public ResponseEntity<ApiResponse<List<BlogPostStatusEnum>>> getStatuses() {
        return ResponseEntity.ok(ApiResponse.success(Arrays.asList(BlogPostStatusEnum.values())));
    }
}

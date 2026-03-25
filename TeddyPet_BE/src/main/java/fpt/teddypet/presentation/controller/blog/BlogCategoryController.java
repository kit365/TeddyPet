package fpt.teddypet.presentation.controller.blog;
import fpt.teddypet.application.constants.blogs.blogcategory.BlogCategoryMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.blogs.category.BlogCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryNestedResponse;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryResponse;
import fpt.teddypet.application.port.input.blogs.BlogCategoryService;
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
@RequestMapping(ApiConstants.API_BLOG_CATEGORIES)
@RequiredArgsConstructor
@Tag(name = "Blog Category", description = "APIs for managing blog categories")
public class BlogCategoryController {

    private final BlogCategoryService blogCategoryService;

    @PostMapping
    @Operation(summary = "Create or Update Blog Category", description = "Creates a new blog category or updates an existing one.")
    public ResponseEntity<ApiResponse<Void>> upsert(@Valid @RequestBody BlogCategoryUpsertRequest request) {
        blogCategoryService.upsert(request);
        String message = request.categoryId() == null 
                ? BlogCategoryMessages.MESSAGE_BLOG_CATEGORY_CREATED_SUCCESS 
                : BlogCategoryMessages.MESSAGE_BLOG_CATEGORY_UPDATED_SUCCESS;
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message));
    }

    @GetMapping
    @Operation(summary = "Get All Blog Categories", description = "Retrieves a list of all active blog categories.")
    public ResponseEntity<ApiResponse<List<BlogCategoryResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(blogCategoryService.getAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Blog Category by ID", description = "Retrieves a blog category by its ID.")
    public ResponseEntity<ApiResponse<BlogCategoryResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(blogCategoryService.getCategoryDetail(id)));
    }
    
    @GetMapping("/nested")
    @Operation(summary = "Get Nested Blog Categories", description = "Retrieves blog categories in a tree structure.")
    public ResponseEntity<ApiResponse<List<BlogCategoryNestedResponse>>> getNested() {
        return ResponseEntity.ok(ApiResponse.success(blogCategoryService.getNestedCategories()));
    }

    @GetMapping("/{id}/children")
    @Operation(summary = "Get Child Categories", description = "Retrieves child categories of a parent category.")
    public ResponseEntity<ApiResponse<List<BlogCategoryResponse>>> getChildren(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(blogCategoryService.getChildCategories(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Blog Category", description = "Soft deletes a blog category.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        blogCategoryService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(BlogCategoryMessages.MESSAGE_BLOG_CATEGORY_DELETED_SUCCESS));
    }
}

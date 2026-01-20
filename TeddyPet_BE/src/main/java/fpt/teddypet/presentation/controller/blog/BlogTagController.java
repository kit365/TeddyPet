package fpt.teddypet.presentation.controller.blog;
import fpt.teddypet.application.constants.blogs.blogtag.BlogTagMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.blogs.tag.BlogTagUpsertRequest;
import fpt.teddypet.application.dto.response.blog.tag.BlogTagResponse;
import fpt.teddypet.application.port.input.blogs.BlogTagService;
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
@RequestMapping(ApiConstants.API_BLOG_TAGS)
@RequiredArgsConstructor
@Tag(name = "Blog Tag", description = "APIs for managing blog tags")
public class BlogTagController {
    private final BlogTagService blogTagService;

    @PostMapping
    @Operation(summary = "Create or Update Blog Tag", description = "Creates a new blog tag or updates an existing one.")
    public ResponseEntity<ApiResponse<Void>> upsert(@Valid @RequestBody BlogTagUpsertRequest request) {
        blogTagService.upsert(request);
        String message = request.tagId() == null 
                ? BlogTagMessages.MESSAGE_BLOG_TAG_CREATED_SUCCESS 
                : BlogTagMessages.MESSAGE_BLOG_TAG_UPDATED_SUCCESS;
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message));
    }

    @GetMapping
    @Operation(summary = "Get All Blog Tags", description = "Retrieves a list of all blog tags.")
    public ResponseEntity<ApiResponse<List<BlogTagResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(blogTagService.getAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Blog Tag by ID", description = "Retrieves a blog tag by its ID.")
    public ResponseEntity<ApiResponse<BlogTagResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(blogTagService.getTagDetail(id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Blog Tag", description = "Deletes a blog tag.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        blogTagService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(BlogTagMessages.MESSAGE_BLOG_TAG_DELETED_SUCCESS));
    }
}

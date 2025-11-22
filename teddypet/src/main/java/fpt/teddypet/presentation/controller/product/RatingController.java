package fpt.teddypet.presentation.controller.product;

import fpt.teddypet.application.constants.products.rating.RatingMessages;
import fpt.teddypet.application.dto.request.RatingRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.product.rating.RatingResponse;
import fpt.teddypet.application.port.input.RatingService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_RATINGS)
@Tag(name = "Đánh giá sản phẩm", description = "API quản lý đánh giá sản phẩm")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Tạo đánh giá sản phẩm", description = "Tạo đánh giá sản phẩm mới (yêu cầu đăng nhập)")
    public ResponseEntity<ApiResponse<RatingResponse>> create(
            @Valid @RequestBody RatingRequest request) {
        RatingResponse response = ratingService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(RatingMessages.MESSAGE_RATING_CREATED_SUCCESS, response));
    }

    @PutMapping("/{ratingId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cập nhật đánh giá sản phẩm", description = "Cập nhật đánh giá sản phẩm (chỉ có thể cập nhật đánh giá của chính mình)")
    public ResponseEntity<ApiResponse<RatingResponse>> update(
            @PathVariable Long ratingId,
            @Valid @RequestBody RatingRequest request) {
        RatingResponse response = ratingService.update(ratingId, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(RatingMessages.MESSAGE_RATING_UPDATED_SUCCESS, response));
    }

    @GetMapping("/{ratingId}")
    @Operation(summary = "Lấy đánh giá theo ID", description = "Lấy thông tin đánh giá theo ID")
    public ResponseEntity<ApiResponse<RatingResponse>> getById(@PathVariable Long ratingId) {
        RatingResponse response = ratingService.getByIdResponse(ratingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả đánh giá", description = "Lấy danh sách tất cả đánh giá")
    public ResponseEntity<ApiResponse<List<RatingResponse>>> getAll() {
        List<RatingResponse> responses = ratingService.getAll();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Lấy đánh giá theo sản phẩm", description = "Lấy danh sách đánh giá của một sản phẩm")
    public ResponseEntity<ApiResponse<List<RatingResponse>>> getByProductId(@PathVariable Long productId) {
        List<RatingResponse> responses = ratingService.getByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Lấy đánh giá theo người dùng", description = "Lấy danh sách đánh giá của một người dùng")
    public ResponseEntity<ApiResponse<List<RatingResponse>>> getByUserId(@PathVariable Long userId) {
        List<RatingResponse> responses = ratingService.getByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{ratingId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xóa đánh giá", description = "Xóa mềm đánh giá (chỉ có thể xóa đánh giá của chính mình)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long ratingId) {
        ratingService.delete(ratingId);
        return ResponseEntity.ok(ApiResponse.success(RatingMessages.MESSAGE_RATING_DELETED_SUCCESS));
    }
}


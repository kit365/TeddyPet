package fpt.teddypet.presentation.controller.feedback;

import fpt.teddypet.application.constants.feedback.FeedbackMessages;
import fpt.teddypet.application.dto.request.feedback.FeedbackRequest;
import fpt.teddypet.application.dto.response.feedback.FeedbackResponse;
import fpt.teddypet.application.dto.response.feedback.FeedbackTokenResponse;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.port.input.feedback.FeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import fpt.teddypet.presentation.constants.ApiConstants;

@RestController
@RequestMapping(ApiConstants.API_FEEDBACKS)
@RequiredArgsConstructor
@Tag(name = "Đánh giá & phản hồi", description = "API cho phép khách gửi và quản lý đánh giá/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    @Operation(summary = "Gửi đánh giá/feedback", description = "Khách hàng gửi đánh giá cho sản phẩm/đơn hàng.")
    public ResponseEntity<ApiResponse<FeedbackResponse>> submitFeedback(@Valid @RequestBody FeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.submitFeedback(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật feedback", description = "Cập nhật nội dung feedback theo ID (nếu được phép).")
    public ResponseEntity<ApiResponse<FeedbackResponse>> updateFeedback(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.updateFeedback(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa feedback", description = "Xóa feedback theo ID.")
    public ResponseEntity<ApiResponse<String>> deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        return ResponseEntity.ok(ApiResponse.success(FeedbackMessages.MESSAGE_FEEDBACK_DELETE_SUCCESS));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Lấy danh sách feedback theo sản phẩm", description = "Lấy tất cả feedback của một sản phẩm.")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> getProductFeedbacks(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getProductFeedbacks(productId)));
    }

    @GetMapping("/token-details/{token}")
    @Operation(summary = "Lấy thông tin token feedback", description = "Dùng token trong email để lấy thông tin feedback liên quan.")
    public ResponseEntity<ApiResponse<FeedbackTokenResponse>> getFeedbackTokenDetails(@PathVariable UUID token) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getFeedbackTokenDetails(token)));
    }

    @GetMapping("/order-details/{orderId}")
    @Operation(summary = "Lấy thông tin feedback của đơn hàng", description = "Lấy thông tin feedback liên quan đến một đơn hàng cụ thể.")
    public ResponseEntity<ApiResponse<FeedbackTokenResponse>> getOrderFeedbackDetails(
            @PathVariable UUID orderId,
            @RequestParam(required = false) String email) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getOrderFeedbackDetails(orderId, email)));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy feedback của tài khoản hiện tại", description = "Lấy tất cả feedback mà người dùng hiện tại đã gửi.")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> getMyFeedbacks() {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getMyFeedbacks()));
    }
}

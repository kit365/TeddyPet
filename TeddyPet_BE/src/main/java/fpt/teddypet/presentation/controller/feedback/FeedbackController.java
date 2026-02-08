package fpt.teddypet.presentation.controller.feedback;

import fpt.teddypet.application.constants.feedback.FeedbackMessages;
import fpt.teddypet.application.dto.request.feedback.FeedbackRequest;
import fpt.teddypet.application.dto.response.feedback.FeedbackResponse;
import fpt.teddypet.application.dto.response.feedback.FeedbackTokenResponse;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.port.input.feedback.FeedbackService;
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
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<ApiResponse<FeedbackResponse>> submitFeedback(@Valid @RequestBody FeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.submitFeedback(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FeedbackResponse>> updateFeedback(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.updateFeedback(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        return ResponseEntity.ok(ApiResponse.success(FeedbackMessages.MESSAGE_FEEDBACK_DELETE_SUCCESS));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> getProductFeedbacks(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getProductFeedbacks(productId)));
    }

    @GetMapping("/token-details/{token}")
    public ResponseEntity<ApiResponse<FeedbackTokenResponse>> getFeedbackTokenDetails(@PathVariable UUID token) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getFeedbackTokenDetails(token)));
    }

    @GetMapping("/order-details/{orderId}")
    public ResponseEntity<ApiResponse<FeedbackTokenResponse>> getOrderFeedbackDetails(
            @PathVariable UUID orderId,
            @RequestParam(required = false) String email) {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getOrderFeedbackDetails(orderId, email)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> getMyFeedbacks() {
        return ResponseEntity.ok(ApiResponse.success(feedbackService.getMyFeedbacks()));
    }
}

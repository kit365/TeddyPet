package fpt.teddypet.application.port.input.feedback;

import fpt.teddypet.application.dto.request.feedback.FeedbackRequest;
import fpt.teddypet.application.dto.response.feedback.FeedbackResponse;
import fpt.teddypet.application.dto.response.feedback.FeedbackTokenResponse;

import java.util.List;
import java.util.UUID;

public interface FeedbackService {
    List<FeedbackResponse> getAllFeedbacks();

    FeedbackResponse submitFeedback(FeedbackRequest request);

    FeedbackResponse updateFeedback(Long feedbackId, FeedbackRequest request);

    FeedbackResponse replyFeedback(Long feedbackId,
            fpt.teddypet.application.dto.request.feedback.FeedbackReplyRequest request);

    FeedbackResponse editFeedbackByAdmin(Long feedbackId,
            fpt.teddypet.application.dto.request.feedback.FeedbackAdminEditRequest request);

    void deleteFeedback(Long feedbackId);

    List<FeedbackResponse> getProductFeedbacks(Long productId);

    FeedbackTokenResponse getFeedbackTokenDetails(UUID token);

    FeedbackTokenResponse getOrderFeedbackDetails(UUID orderId, String email);

    List<FeedbackResponse> getMyFeedbacks();

    void sendFeedbackEmailsForOrder(UUID orderId);
}

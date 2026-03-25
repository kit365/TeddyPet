import '../../models/request/feedback/feedback_request.dart';
import '../../models/response/feedback/feedback_response.dart';
import '../../models/response/feedback/feedback_token_response.dart';

abstract class FeedbackRepository {
  Future<FeedbackResponse?> submitFeedback(FeedbackRequest request);
  Future<List<FeedbackResponse>> getMyFeedbacks();
  Future<FeedbackTokenResponse?> getOrderFeedbackDetails(String orderId, {String? email});
}

import '../../../application/feedback/feedback_app_service.dart';
import '../../../data/models/request/feedback/feedback_request.dart';
import '../../../data/models/response/feedback/feedback_response.dart';
import '../../../data/models/response/feedback/feedback_token_response.dart';

class FeedbackController {
  final FeedbackAppService _service;

  FeedbackController(this._service);

  Future<FeedbackResponse?> submitFeedback(FeedbackRequest request) {
    return _service.submitFeedback(request);
  }

  Future<List<FeedbackResponse>> getMyFeedbacks() {
    return _service.getMyFeedbacks();
  }

  Future<FeedbackTokenResponse?> getOrderFeedbackDetails(String orderId) {
    return _service.getOrderFeedbackDetails(orderId);
  }
}

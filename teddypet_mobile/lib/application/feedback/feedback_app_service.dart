import '../../data/models/request/feedback/feedback_request.dart';
import '../../data/models/response/feedback/feedback_response.dart';
import '../../data/models/response/feedback/feedback_token_response.dart';
import '../../data/repositories/feedback/feedback_repository.dart';

abstract class FeedbackAppService {
  Future<FeedbackResponse?> submitFeedback(FeedbackRequest request);
  Future<List<FeedbackResponse>> getMyFeedbacks();
  Future<FeedbackTokenResponse?> getOrderFeedbackDetails(String orderId);
}

class FeedbackAppServiceImpl implements FeedbackAppService {
  final FeedbackRepository _repository;

  FeedbackAppServiceImpl(this._repository);

  @override
  Future<FeedbackResponse?> submitFeedback(FeedbackRequest request) {
    return _repository.submitFeedback(request);
  }

  @override
  Future<List<FeedbackResponse>> getMyFeedbacks() {
    return _repository.getMyFeedbacks();
  }

  @override
  Future<FeedbackTokenResponse?> getOrderFeedbackDetails(String orderId) {
    return _repository.getOrderFeedbackDetails(orderId);
  }
}

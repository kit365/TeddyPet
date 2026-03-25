import '../../../../data/models/response/feedback/feedback_token_response.dart';

class OrderReviewArguments {
  final String orderId;
  final FeedbackTokenResponse feedbackDetails;

  OrderReviewArguments({
    required this.orderId,
    required this.feedbackDetails,
  });
}

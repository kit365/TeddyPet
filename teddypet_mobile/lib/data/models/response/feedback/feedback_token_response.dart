import 'feedback_item_response.dart';

class FeedbackTokenResponse {
  final String? token;
  final String? customerName;
  final String? customerEmail;
  final List<FeedbackItemResponse> items;

  FeedbackTokenResponse({
    this.token,
    this.customerName,
    this.customerEmail,
    required this.items,
  });

  factory FeedbackTokenResponse.fromJson(Map<String, dynamic> json) {
    return FeedbackTokenResponse(
      token: json['token']?.toString(),
      customerName: json['customerName'],
      customerEmail: json['customerEmail'],
      items: (json['items'] as List?)
              ?.map((item) => FeedbackItemResponse.fromJson(item))
              .toList() ??
          [],
    );
  }
}

class FeedbackItemResponse {
  final int productId;
  final int? variantId;
  final String productName;
  final String variantName;
  final String? imageUrl;
  final int? rating;
  final String? comment;
  final bool isSubmitted;

  FeedbackItemResponse({
    required this.productId,
    this.variantId,
    required this.productName,
    required this.variantName,
    this.imageUrl,
    this.rating,
    this.comment,
    required this.isSubmitted,
  });

  factory FeedbackItemResponse.fromJson(Map<String, dynamic> json) {
    return FeedbackItemResponse(
      productId: (json['productId'] as num).toInt(),
      variantId: (json['variantId'] as num?)?.toInt(),
      productName: json['productName'] ?? '',
      variantName: json['variantName'] ?? '',
      imageUrl: json['imageUrl'],
      rating: (json['rating'] as num?)?.toInt(),
      comment: json['comment'],
      isSubmitted: json['isSubmitted'] ?? false,
    );
  }
}

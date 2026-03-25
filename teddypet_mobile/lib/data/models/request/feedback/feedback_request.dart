class FeedbackRequest {
  final String? token; // For guest (though mobile usually uses orderId)
  final String? orderId; // For logged in user
  final int productId;
  final int? variantId;
  final int rating;
  final String comment;

  FeedbackRequest({
    this.token,
    this.orderId,
    required this.productId,
    this.variantId,
    required this.rating,
    required this.comment,
  });

  Map<String, dynamic> toJson() {
    return {
      if (token != null) 'token': token,
      if (orderId != null) 'orderId': orderId,
      'productId': productId,
      if (variantId != null) 'variantId': variantId,
      'rating': rating,
      'comment': comment,
    };
  }
}

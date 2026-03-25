class ProductReviewsArguments {
  final int productId;
  final String productName;
  final double rating;
  final int totalReviews;

  ProductReviewsArguments({
    required this.productId,
    required this.productName,
    required this.rating,
    required this.totalReviews,
  });
}

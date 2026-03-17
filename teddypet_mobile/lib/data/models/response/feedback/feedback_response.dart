class FeedbackResponse {
  final int id;
  final String? userName;
  final String? guestName;
  final int productId;
  final String productName;
  final String? productSlug;
  final String? productImage;
  final int? variantId;
  final String? variantName;
  final int rating;
  final String comment;
  final String? replyComment;
  final String? repliedAt;
  final bool isEdited;
  final bool isPurchased;
  final String createdAt;
  final String? updatedAt;

  FeedbackResponse({
    required this.id,
    this.userName,
    this.guestName,
    required this.productId,
    required this.productName,
    this.productSlug,
    this.productImage,
    this.variantId,
    this.variantName,
    required this.rating,
    required this.comment,
    this.replyComment,
    this.repliedAt,
    required this.isEdited,
    required this.isPurchased,
    required this.createdAt,
    this.updatedAt,
  });

  factory FeedbackResponse.fromJson(Map<String, dynamic> json) {
    return FeedbackResponse(
      id: json['id'],
      userName: json['userName'],
      guestName: json['guestName'],
      productId: json['productId'],
      productName: json['productName'],
      productSlug: json['productSlug'],
      productImage: json['productImage'],
      variantId: json['variantId'],
      variantName: json['variantName'],
      rating: json['rating'],
      comment: json['comment'],
      replyComment: json['replyComment'],
      repliedAt: json['repliedAt'],
      isEdited: json['isEdited'] ?? false,
      isPurchased: json['isPurchased'] ?? false,
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }
}

import '../../response/feedback/feedback_response.dart';

class FeedbackEntity {
  final int id;
  final String userName;
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
  final DateTime createdAt;
  final DateTime? updatedAt;

  FeedbackEntity({
    required this.id,
    required this.userName,
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

  factory FeedbackEntity.fromResponse(FeedbackResponse response) {
    return FeedbackEntity(
      id: response.id,
      userName: response.userName ?? 'Ẩn danh',
      guestName: response.guestName,
      productId: response.productId,
      productName: response.productName,
      productSlug: response.productSlug,
      productImage: response.productImage,
      variantId: response.variantId,
      variantName: response.variantName,
      rating: response.rating,
      comment: response.comment,
      replyComment: response.replyComment,
      repliedAt: response.repliedAt,
      isEdited: response.isEdited,
      isPurchased: response.isPurchased,
      createdAt: DateTime.tryParse(response.createdAt) ?? DateTime.now(),
      updatedAt: response.updatedAt != null ? DateTime.tryParse(response.updatedAt!) : null,
    );
  }
}

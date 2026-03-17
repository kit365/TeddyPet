import 'dart:math';

class ProductResponse {
  final int productId;
  final String slug;
  final String name;
  final double minPrice;
  final double maxPrice;
  final String? status;
  final String? productType;
  final String? stockStatus;
  final List<String>? images;
  final String? brandName;

  ProductResponse({
    required this.productId,
    required this.slug,
    required this.name,
    required this.minPrice,
    required this.maxPrice,
    this.status,
    this.productType,
    this.stockStatus,
    this.images,
    this.brandName,
  });

  factory ProductResponse.fromJson(Map<String, dynamic> json) {
    // Backend returns images as a list of ProductImageInfo objects or just URLs depending on endpoint
    // In our case, the list and search endpoints return minimal info
    List<String> imageUrls = [];
    if (json['images'] != null) {
      imageUrls = (json['images'] as List).map((i) {
        if (i is String) return i;
        if (i is Map && i['imageUrl'] != null) return i['imageUrl'].toString();
        return '';
      }).where((s) => s.isNotEmpty).toList();
    }

    return ProductResponse(
      productId: json['productId'] ?? 0,
      slug: json['slug'] ?? '',
      name: json['name'] ?? '',
      minPrice: (json['minPrice'] ?? 0).toDouble(),
      maxPrice: (json['maxPrice'] ?? 0).toDouble(),
      status: json['status'],
      productType: json['productType'],
      stockStatus: json['stockStatus'],
      images: imageUrls,
      brandName: json['brand'] != null ? json['brand']['name'] : null,
    );
  }

  String? get firstImage => images != null && images!.isNotEmpty ? images!.first : null;
}

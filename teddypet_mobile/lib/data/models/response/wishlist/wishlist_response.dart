class ProductWishlistInfo {
  final int id;
  final String name;
  final String slug;
  final double minPrice;
  final double maxPrice;
  final List<ProductImageInfo> images;
  final List<ProductVariantInfo> variants;

  ProductWishlistInfo({
    required this.id,
    required this.name,
    required this.slug,
    required this.minPrice,
    required this.maxPrice,
    required this.images,
    required this.variants,
  });

  factory ProductWishlistInfo.fromJson(Map<String, dynamic> json) {
    return ProductWishlistInfo(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      minPrice: (json['minPrice'] ?? 0).toDouble(),
      maxPrice: (json['maxPrice'] ?? 0).toDouble(),
      images: (json['images'] as List?)
              ?.map((e) => ProductImageInfo.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      variants: (json['variants'] as List?)
              ?.map((e) => ProductVariantInfo.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class ProductImageInfo {
  final int? id;
  final String imageUrl;

  ProductImageInfo({
    this.id,
    required this.imageUrl,
  });

  factory ProductImageInfo.fromJson(Map<String, dynamic> json) {
    return ProductImageInfo(
      id: json['id'],
      imageUrl: json['imageUrl'] ?? '',
    );
  }
}

class ProductVariantInfo {
  final int variantId;
  final double price;
  final double? salePrice;
  final int stockQuantity;

  ProductVariantInfo({
    required this.variantId,
    required this.price,
    this.salePrice,
    required this.stockQuantity,
  });

  factory ProductVariantInfo.fromJson(Map<String, dynamic> json) {
    return ProductVariantInfo(
      variantId: json['variantId'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
      salePrice:
          json['salePrice'] != null ? (json['salePrice'] as num).toDouble() : null,
      stockQuantity: json['stockQuantity'] ?? 0,
    );
  }
}

class WishlistResponse {
  final int id;
  final int productId;
  final ProductWishlistInfo product;
  final DateTime addedAt;

  WishlistResponse({
    required this.id,
    required this.productId,
    required this.product,
    required this.addedAt,
  });

  factory WishlistResponse.fromJson(Map<String, dynamic> json) {
    return WishlistResponse(
      id: json['id'] ?? 0,
      productId: json['productId'] ?? 0,
      product: ProductWishlistInfo.fromJson(json['product'] ?? {}),
      addedAt: DateTime.parse(json['addedAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class ProductImageResponse {
  final int id;
  final String imageUrl;

  ProductImageResponse({
    required this.id,
    required this.imageUrl,
  });

  factory ProductImageResponse.fromJson(Map<String, dynamic> json) {
    return ProductImageResponse(
      id: json['id'] ?? 0,
      imageUrl: json['imageUrl'] ?? '',
    );
  }
}

class ProductAttributeValueResponse {
  final int valueId;
  final int attributeId;
  final String attributeName;
  final String value;
  final int displayOrder;
  final String displayCode;

  ProductAttributeValueResponse({
    required this.valueId,
    required this.attributeId,
    required this.attributeName,
    required this.value,
    required this.displayOrder,
    required this.displayCode,
  });

  factory ProductAttributeValueResponse.fromJson(Map<String, dynamic> json) {
    return ProductAttributeValueResponse(
      valueId: json['valueId'] ?? 0,
      attributeId: json['attributeId'] ?? 0,
      attributeName: json['attributeName'] ?? '',
      value: json['value'] ?? '',
      displayOrder: json['displayOrder'] ?? 0,
      displayCode: json['displayCode'] ?? '',
    );
  }
}

class ProductVariantResponse {
  final int variantId;
  final int productId;
  final String name;
  final double price;
  final double? salePrice;
  final int stockQuantity;
  final String unit;
  final String? featuredImageUrl;
  final String sku;
  final String status;
  final List<ProductAttributeValueResponse> attributes;

  ProductVariantResponse({
    required this.variantId,
    required this.productId,
    required this.name,
    required this.price,
    required this.salePrice,
    required this.stockQuantity,
    required this.unit,
    required this.featuredImageUrl,
    required this.sku,
    required this.status,
    required this.attributes,
  });

  bool get hasSale => salePrice != null && salePrice! > 0 && salePrice! < price;

  double get displayPrice => hasSale ? salePrice! : price;

  factory ProductVariantResponse.fromJson(Map<String, dynamic> json) {
    return ProductVariantResponse(
      variantId: json['variantId'] ?? 0,
      productId: json['productId'] ?? 0,
      name: json['name'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      salePrice: json['salePrice'] != null ? (json['salePrice'] as num).toDouble() : null,
      stockQuantity: json['stockQuantity'] ?? 0,
      unit: json['unit'] ?? '',
      featuredImageUrl: json['featuredImageUrl'],
      sku: json['sku'] ?? '',
      status: json['status'] ?? 'ACTIVE',
      attributes: (json['attributes'] as List?)
              ?.map((e) => ProductAttributeValueResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class ProductAttributeResponse {
  final int attributeId;
  final String name;
  final List<int> valueIds;

  ProductAttributeResponse({
    required this.attributeId,
    required this.name,
    required this.valueIds,
  });

  factory ProductAttributeResponse.fromJson(Map<String, dynamic> json) {
    return ProductAttributeResponse(
      attributeId: json['attributeId'] ?? 0,
      name: json['name'] ?? '',
      valueIds: (json['valueIds'] as List?)?.map((e) => (e as num).toInt()).toList() ?? [],
    );
  }
}

class ProductDetailResponse {
  final int id;
  final String slug;
  final String name;
  final String description;
  final String metaTitle;
  final String metaDescription;
  final double minPrice;
  final double maxPrice;
  final String origin;
  final String material;
  final int viewCount;
  final int soldCount;
  final int ratingCount;
  final double averageRating;
  final String status;
  final String productType;
  final List<dynamic> categories;
  final List<dynamic> tags;
  final List<ProductAttributeResponse> attributes;
  final List<ProductVariantResponse> variants;
  final List<ProductImageResponse> images;

  ProductDetailResponse({
    required this.id,
    required this.slug,
    required this.name,
    required this.description,
    required this.metaTitle,
    required this.metaDescription,
    required this.minPrice,
    required this.maxPrice,
    required this.origin,
    required this.material,
    required this.viewCount,
    required this.soldCount,
    required this.ratingCount,
    required this.averageRating,
    required this.status,
    required this.productType,
    required this.categories,
    required this.tags,
    required this.attributes,
    required this.variants,
    required this.images,
  });

  factory ProductDetailResponse.fromJson(Map<String, dynamic> json) {
    return ProductDetailResponse(
      id: json['id'] ?? 0,
      slug: json['slug'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      metaTitle: json['metaTitle'] ?? '',
      metaDescription: json['metaDescription'] ?? '',
      minPrice: (json['minPrice'] ?? 0).toDouble(),
      maxPrice: (json['maxPrice'] ?? 0).toDouble(),
      origin: json['origin'] ?? '',
      material: json['material'] ?? '',
      viewCount: json['viewCount'] ?? 0,
      soldCount: json['soldCount'] ?? 0,
      ratingCount: json['ratingCount'] ?? 0,
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      status: json['status'] ?? 'ACTIVE',
      productType: json['productType'] ?? 'VARIABLE',
      categories: (json['categories'] as List?) ?? [],
      tags: (json['tags'] as List?) ?? [],
      attributes: (json['attributes'] as List?)
              ?.map((e) => ProductAttributeResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      variants: (json['variants'] as List?)
              ?.map((e) => ProductVariantResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      images: (json['images'] as List?)
              ?.map((e) => ProductImageResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

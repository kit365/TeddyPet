class CartResponse {
  final int userId;
  final List<CartItemResponse> items;
  final double totalAmount;
  final int totalItems;

  CartResponse({
    required this.userId,
    required this.items,
    required this.totalAmount,
    required this.totalItems,
  });

  factory CartResponse.fromJson(Map<String, dynamic> json) {
    return CartResponse(
      userId: json['userId'] ?? 0,
      items: (json['items'] as List?)
              ?.map((item) => CartItemResponse.fromJson(item))
              .toList() ??
          [],
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      totalItems: json['totalItems'] ?? 0,
    );
  }
}

class CartItemResponse {
  final int variantId;
  final String sku;
  final String productName;
  final String variantName;
  final String? featuredImageUrl;
  final String? altImage;
  
  final double price;
  final double? salePrice;
  final double finalPrice;

  final int quantity;
  final double subTotal;

  final int stockQuantity;
  final bool isAvailable;

  CartItemResponse({
    required this.variantId,
    required this.sku,
    required this.productName,
    required this.variantName,
    this.featuredImageUrl,
    this.altImage,
    required this.price,
    this.salePrice,
    required this.finalPrice,
    required this.quantity,
    required this.subTotal,
    required this.stockQuantity,
    required this.isAvailable,
  });

  factory CartItemResponse.fromJson(Map<String, dynamic> json) {
    return CartItemResponse(
      variantId: json['variantId'] ?? 0,
      sku: json['sku'] ?? '',
      productName: json['productName'] ?? '',
      variantName: json['variantName'] ?? '',
      featuredImageUrl: json['featuredImageUrl'],
      altImage: json['altImage'],
      price: (json['price'] ?? 0).toDouble(),
      salePrice: json['salePrice'] != null ? json['salePrice'].toDouble() : null,
      finalPrice: (json['finalPrice'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 0,
      subTotal: (json['subTotal'] ?? 0).toDouble(),
      stockQuantity: json['stockQuantity'] ?? 0,
      isAvailable: json['isAvailable'] ?? false,
    );
  }
}

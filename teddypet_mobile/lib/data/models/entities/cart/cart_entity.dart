import '../../response/cart/cart_response.dart';

class CartEntity {
  final int userId;
  final List<CartItemEntity> items;
  final double totalAmount;
  final int totalItems;

  CartEntity({
    required this.userId,
    required this.items,
    required this.totalAmount,
    required this.totalItems,
  });

  factory CartEntity.fromResponse(CartResponse response) {
    return CartEntity(
      userId: response.userId,
      items: response.items.map((item) => CartItemEntity.fromResponse(item)).toList(),
      totalAmount: response.totalAmount,
      totalItems: response.totalItems,
    );
  }
}

class CartItemEntity {
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

  CartItemEntity({
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

  factory CartItemEntity.fromResponse(CartItemResponse response) {
    return CartItemEntity(
      variantId: response.variantId,
      sku: response.sku,
      productName: response.productName,
      variantName: response.variantName,
      featuredImageUrl: response.featuredImageUrl,
      altImage: response.altImage,
      price: response.price,
      salePrice: response.salePrice,
      finalPrice: response.finalPrice,
      quantity: response.quantity,
      subTotal: response.subTotal,
      stockQuantity: response.stockQuantity,
      isAvailable: response.isAvailable,
    );
  }
}

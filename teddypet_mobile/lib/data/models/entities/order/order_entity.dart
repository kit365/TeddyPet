import 'package:teddypet_mobile/data/models/response/order/order_response.dart';

class OrderEntity {
  final String id;
  final String orderCode;
  final double subtotal;
  final double shippingFee;
  final double discountAmount;
  final double finalAmount;
  final String orderType;
  final String? paymentMethod;
  final String status;
  final String? shippingAddress;
  final String? shippingName;
  final String? shippingPhone;
  final List<OrderItemEntity> items;
  final String? createdAt;
  final String? deliveredAt;
  final String? completedAt;
  final String? cancelledAt;
  final String? cancelReason;
  final String? returnReason;
  final String? adminReturnNote;

  OrderEntity({
    required this.id,
    required this.orderCode,
    required this.subtotal,
    required this.shippingFee,
    required this.discountAmount,
    required this.finalAmount,
    required this.orderType,
    this.paymentMethod,
    required this.status,
    this.shippingAddress,
    this.shippingName,
    this.shippingPhone,
    required this.items,
    this.createdAt,
    this.deliveredAt,
    this.completedAt,
    this.cancelledAt,
    this.cancelReason,
    this.returnReason,
    this.adminReturnNote,
  });

  factory OrderEntity.fromResponse(OrderResponse data) {
    return OrderEntity(
      id: data.id,
      orderCode: data.orderCode,
      subtotal: data.subtotal,
      shippingFee: data.shippingFee,
      discountAmount: data.discountAmount,
      finalAmount: data.finalAmount,
      orderType: data.orderType,
      paymentMethod: data.paymentMethod,
      status: data.status,
      shippingAddress: data.shippingAddress,
      shippingName: data.shippingName,
      shippingPhone: data.shippingPhone,
      items: data.orderItems.map((item) => OrderItemEntity.fromResponse(item)).toList(),
      createdAt: data.createdAt,
      deliveredAt: data.deliveredAt,
      completedAt: data.completedAt,
      cancelledAt: data.cancelledAt,
      cancelReason: data.cancelReason,
      returnReason: data.returnReason,
      adminReturnNote: data.adminReturnNote,
    );
  }
}

class OrderItemEntity {
  final int variantId;
  final String productName;
  final String variantName;
  final double unitPrice;
  final int quantity;
  final double totalPrice;
  final String? imageUrl;
  final String? altImage;

  OrderItemEntity({
    required this.variantId,
    required this.productName,
    required this.variantName,
    required this.unitPrice,
    required this.quantity,
    required this.totalPrice,
    this.imageUrl,
    this.altImage,
  });

  factory OrderItemEntity.fromResponse(OrderItemResponse data) {
    return OrderItemEntity(
      variantId: data.variantId?.toInt() ?? 0,
      productName: data.productName,
      variantName: data.variantName,
      unitPrice: data.unitPrice,
      quantity: data.quantity,
      totalPrice: data.totalPrice,
      imageUrl: data.imageUrl,
      altImage: data.altImage,
    );
  }
}

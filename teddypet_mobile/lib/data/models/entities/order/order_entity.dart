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
  final String? paymentStatus;
  final String status;
  final String? shippingAddress;
  final String? shippingName;
  final String? shippingPhone;
  final String? notes;
  final String? voucherCode;
  final double? distanceKm;
  final List<OrderItemEntity> items;
  final List<PaymentEntity> payments;
  final UserOrderInfo? user;
  final String? guestEmail;
  final String? createdAt;
  final String? deliveringAt;
  final String? deliveredAt;
  final String? completedAt;
  final String? cancelledAt;
  final String? cancelledBy;
  final String? cancelReason;
  final String? returnReason;
  final String? returnEvidence;
  final String? returnRequestedAt;
  final String? adminReturnNote;
  final String? updatedAt;

  OrderEntity({
    required this.id,
    required this.orderCode,
    required this.subtotal,
    required this.shippingFee,
    required this.discountAmount,
    required this.finalAmount,
    required this.orderType,
    this.paymentMethod,
    this.paymentStatus,
    required this.status,
    this.shippingAddress,
    this.shippingName,
    this.shippingPhone,
    this.notes,
    this.voucherCode,
    this.distanceKm,
    required this.items,
    required this.payments,
    this.user,
    this.guestEmail,
    this.createdAt,
    this.deliveringAt,
    this.deliveredAt,
    this.completedAt,
    this.cancelledAt,
    this.cancelledBy,
    this.cancelReason,
    this.returnReason,
    this.returnEvidence,
    this.returnRequestedAt,
    this.adminReturnNote,
    this.updatedAt,
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
      paymentStatus: data.paymentStatus,
      status: data.status,
      shippingAddress: data.shippingAddress,
      shippingName: data.shippingName,
      shippingPhone: data.shippingPhone,
      notes: data.notes,
      voucherCode: data.voucherCode,
      distanceKm: data.distanceKm,
      items: data.orderItems.map((item) => OrderItemEntity.fromResponse(item)).toList(),
      payments: data.payments.map((p) => PaymentEntity.fromResponse(p)).toList(),
      user: data.user != null ? UserOrderInfo.fromResponse(data.user!) : null,
      guestEmail: data.guestEmail,
      createdAt: data.createdAt,
      deliveringAt: data.deliveringAt,
      deliveredAt: data.deliveredAt,
      completedAt: data.completedAt,
      cancelledAt: data.cancelledAt,
      cancelledBy: data.cancelledBy,
      cancelReason: data.cancelReason,
      returnReason: data.returnReason,
      returnEvidence: data.returnEvidence,
      returnRequestedAt: data.returnRequestedAt,
      adminReturnNote: data.adminReturnNote,
      updatedAt: data.updatedAt,
    );
  }
}

class OrderItemEntity {
  final int? id;
  final int? productId;
  final int variantId;
  final String productName;
  final String variantName;
  final double unitPrice;
  final int quantity;
  final double totalPrice;
  final String? imageUrl;
  final String? altImage;

  OrderItemEntity({
    this.id,
    this.productId,
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
      id: data.id?.toInt(),
      productId: data.productId?.toInt(),
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

class PaymentEntity {
  final String? paymentUrl;
  final String? orderCode;
  final double? amount;
  final String? status;
  final String? paymentMethod;

  PaymentEntity({
    this.paymentUrl,
    this.orderCode,
    this.amount,
    this.status,
    this.paymentMethod,
  });

  factory PaymentEntity.fromResponse(PaymentResponse data) {
    return PaymentEntity(
      paymentUrl: data.paymentUrl,
      orderCode: data.orderCode,
      amount: data.amount,
      status: data.status,
      paymentMethod: data.paymentMethod,
    );
  }
}

class UserOrderInfo {
  final String? userId;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? phoneNumber;
  final String? avatarUrl;
  final String? altImage;

  UserOrderInfo({
    this.userId,
    this.firstName,
    this.lastName,
    this.email,
    this.phoneNumber,
    this.avatarUrl,
    this.altImage,
  });

  String get fullName => '${firstName ?? ''} ${lastName ?? ''}'.trim();

  factory UserOrderInfo.fromResponse(UserOrderInfoResponse data) {
    return UserOrderInfo(
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      avatarUrl: data.avatarUrl,
      altImage: data.altImage,
    );
  }
}

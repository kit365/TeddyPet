class OrderResponse {
  final String id;
  final String orderCode;
  final num? numericCode;
  final UserOrderInfoResponse? user;
  final int? userAddressId;
  final String? guestEmail;
  final double subtotal;
  final double shippingFee;
  final double discountAmount;
  final String? voucherCode;
  final double finalAmount;
  final String orderType;
  final String status;
  final String? shippingAddress;
  final String? shippingPhone;
  final String? shippingName;
  final String? notes;
  final List<OrderItemResponse> orderItems;
  final List<PaymentResponse> payments;
  final double? distanceKm;
  final String? cancelReason;
  final String? cancelledAt;
  final String? cancelledBy;
  final String? deliveredAt;
  final String? deliveringAt;
  final String? completedAt;
  final String? returnReason;
  final String? returnEvidence;
  final String? returnRequestedAt;
  final String? adminReturnNote;
  final String? createdAt;
  final String? updatedAt;

  // Thuận tiện cho UI, lấy từ payments[0]
  String? get paymentMethod => payments.isNotEmpty ? payments.first.paymentMethod : null;
  String? get paymentStatus => payments.isNotEmpty ? payments.first.status : null;

  OrderResponse({
    required this.id,
    required this.orderCode,
    this.numericCode,
    this.user,
    this.userAddressId,
    this.guestEmail,
    required this.subtotal,
    required this.shippingFee,
    required this.discountAmount,
    this.voucherCode,
    required this.finalAmount,
    required this.orderType,
    required this.status,
    this.shippingAddress,
    this.shippingPhone,
    this.shippingName,
    this.notes,
    required this.orderItems,
    required this.payments,
    this.distanceKm,
    this.cancelReason,
    this.cancelledAt,
    this.cancelledBy,
    this.deliveredAt,
    this.deliveringAt,
    this.completedAt,
    this.returnReason,
    this.returnEvidence,
    this.returnRequestedAt,
    this.adminReturnNote,
    this.createdAt,
    this.updatedAt,
  });

  factory OrderResponse.fromJson(Map<String, dynamic> json) {
    return OrderResponse(
      id: json['id'] as String,
      orderCode: json['orderCode'] as String,
      numericCode: json['numericCode'] as num?,
      user: json['user'] != null ? UserOrderInfoResponse.fromJson(json['user'] as Map<String, dynamic>) : null,
      userAddressId: json['userAddressId'] as int?,
      guestEmail: json['guestEmail'] as String?,
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      shippingFee: (json['shippingFee'] ?? 0).toDouble(),
      discountAmount: (json['discountAmount'] ?? 0).toDouble(),
      voucherCode: json['voucherCode'] as String?,
      finalAmount: (json['finalAmount'] ?? 0).toDouble(),
      orderType: json['orderType'] as String,
      status: json['status'] as String,
      shippingAddress: json['shippingAddress'] as String?,
      shippingPhone: json['shippingPhone'] as String?,
      shippingName: json['shippingName'] as String?,
      notes: json['notes'] as String?,
      orderItems: (json['orderItems'] as List<dynamic>?)
              ?.map((e) => OrderItemResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      payments: (json['payments'] as List<dynamic>?)
              ?.map((e) => PaymentResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      cancelReason: json['cancelReason'] as String?,
      cancelledAt: json['cancelledAt'] as String?,
      cancelledBy: json['cancelledBy'] as String?,
      deliveredAt: json['deliveredAt'] as String?,
      deliveringAt: json['deliveringAt'] as String?,
      completedAt: json['completedAt'] as String?,
      returnReason: json['returnReason'] as String?,
      returnEvidence: json['returnEvidence'] as String?,
      returnRequestedAt: json['returnRequestedAt'] as String?,
      adminReturnNote: json['adminReturnNote'] as String?,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );
  }
}

/// User info trong response order
class UserOrderInfoResponse {
  final String? userId;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? phoneNumber;
  final String? avatarUrl;
  final String? altImage;

  UserOrderInfoResponse({
    this.userId,
    this.firstName,
    this.lastName,
    this.email,
    this.phoneNumber,
    this.avatarUrl,
    this.altImage,
  });

  String get fullName => '${firstName ?? ''} ${lastName ?? ''}'.trim();

  factory UserOrderInfoResponse.fromJson(Map<String, dynamic> json) {
    return UserOrderInfoResponse(
      userId: json['userId'] as String?,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      email: json['email'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      altImage: json['altImage'] as String?,
    );
  }
}

class OrderItemResponse {
  final num? id;
  final num? productId;
  final num? variantId;
  final String productName;
  final String variantName;
  final double unitPrice;
  final int quantity;
  final double totalPrice;
  final String? imageUrl;
  final String? altImage;

  OrderItemResponse({
    this.id,
    this.productId,
    this.variantId,
    required this.productName,
    required this.variantName,
    required this.unitPrice,
    required this.quantity,
    required this.totalPrice,
    this.imageUrl,
    this.altImage,
  });

  factory OrderItemResponse.fromJson(Map<String, dynamic> json) {
    return OrderItemResponse(
      id: json['id'] as num?,
      productId: json['productId'] as num?,
      variantId: json['variantId'] as num?,
      productName: json['productName'] as String? ?? '',
      variantName: json['variantName'] as String? ?? '',
      unitPrice: (json['unitPrice'] ?? 0).toDouble(),
      quantity: json['quantity'] as int? ?? 0,
      totalPrice: (json['totalPrice'] ?? 0).toDouble(),
      imageUrl: json['imageUrl'] as String?,
      altImage: json['altImage'] as String?,
    );
  }
}

class PaymentResponse {
  final String? paymentUrl;
  final String? orderCode;
  final double? amount;
  final String? status;
  final String? paymentMethod;

  PaymentResponse({
    this.paymentUrl,
    this.orderCode,
    this.amount,
    this.status,
    this.paymentMethod,
  });

  factory PaymentResponse.fromJson(Map<String, dynamic> json) {
    return PaymentResponse(
      paymentUrl: json['paymentUrl'] as String?,
      orderCode: json['orderCode'] as String?,
      amount: (json['amount'] ?? 0).toDouble(),
      status: json['status'] as String?,
      paymentMethod: json['paymentMethod'] as String?,
    );
  }
}

class OrderRequest {
  final String paymentMethod;
  final int? userAddressId;
  final String? receiverName;
  final String? receiverPhone;
  final String? shippingAddress;
  final String? note;
  final List<OrderItemRequest> items;
  final String? voucherCode;
  final double? latitude;
  final double? longitude;

  OrderRequest({
    required this.paymentMethod,
    this.userAddressId,
    this.receiverName,
    this.receiverPhone,
    this.shippingAddress,
    this.note,
    required this.items,
    this.voucherCode,
    this.latitude,
    this.longitude,
  });

  Map<String, dynamic> toJson() {
    return {
      'paymentMethod': paymentMethod, 
      if (userAddressId != null) 'userAddressId': userAddressId,
      if (receiverName != null) 'receiverName': receiverName,
      if (receiverPhone != null) 'receiverPhone': receiverPhone,
      if (shippingAddress != null) 'shippingAddress': shippingAddress,
      'note': (note == null || note!.isEmpty) ? null : note,
      'items': items.map((e) => e.toJson()).toList(),
      if (voucherCode != null) 'voucherCode': voucherCode,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
    };
  }
}

class OrderItemRequest {
  final int variantId;
  final int quantity;

  OrderItemRequest({required this.variantId, required this.quantity});

  Map<String, dynamic> toJson() {
    return {
      'variantId': variantId,
      'quantity': quantity,
    };
  }
}

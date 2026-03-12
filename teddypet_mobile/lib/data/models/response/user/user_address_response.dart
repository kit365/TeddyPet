import 'dart:convert';

class UserAddressResponse {
  final int id;
  final String userId;
  final String fullName;
  final String phone;
  final String address;
  final double? longitude;
  final double? latitude;
  final bool isDefault;

  UserAddressResponse({
    required this.id,
    required this.userId,
    required this.fullName,
    required this.phone,
    required this.address,
    this.longitude,
    this.latitude,
    this.isDefault = false,
  });

  factory UserAddressResponse.fromJson(Map<String, dynamic> json) {
    return UserAddressResponse(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      userId: json['userId']?.toString() ?? '',
      fullName: json['fullName'] ?? '',
      phone: json['phone'] ?? '',
      address: json['address'] ?? '',
      longitude: json['longitude']?.toDouble(),
      latitude: json['latitude']?.toDouble(),
      isDefault: json['isDefault'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'fullName': fullName,
      'phone': phone,
      'address': address,
      'longitude': longitude,
      'latitude': latitude,
      'isDefault': isDefault,
    };
  }
}

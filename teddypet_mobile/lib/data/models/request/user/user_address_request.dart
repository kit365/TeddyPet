class UserAddressRequest {
  final String fullName;
  final String phone;
  final String address;
  final double? longitude;
  final double? latitude;
  final bool isDefault;

  UserAddressRequest({
    required this.fullName,
    required this.phone,
    required this.address,
    this.longitude,
    this.latitude,
    this.isDefault = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'phone': phone,
      'address': address,
      'longitude': longitude,
      'latitude': latitude,
      'isDefault': isDefault,
    };
  }
}

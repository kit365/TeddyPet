import 'package:flutter/foundation.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';

class GeoLocationResult {
  final String province;
  final String district;
  final String ward;
  final String street;
  final double latitude;
  final double longitude;

  GeoLocationResult({
    required this.province,
    required this.district,
    required this.ward,
    required this.street,
    required this.latitude,
    required this.longitude,
  });
}

class GeoLocationService {
  Future<GeoLocationResult?> getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    // 1. Kiểm tra service định vị
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw 'Dịch vụ định vị đã bị tắt. Vui lòng bật GPS.';
    }

    // 2. Kiểm tra quyền
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw 'Quyền truy cập vị trí bị từ chối.';
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw 'Quyền truy cập vị trí bị từ chối vĩnh viễn. Vui lòng bật trong cài đặt.';
    }

    // 3. Lấy vị trí
    Position position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    // 4. Reverse geocoding
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      ).timeout(const Duration(seconds: 5));

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks.first;
        return GeoLocationResult(
          province: place.administrativeArea ?? '',
          district: place.subAdministrativeArea ?? place.locality ?? '',
          ward: place.subLocality ?? '',
          street: place.street ?? '',
          latitude: position.latitude,
          longitude: position.longitude,
        );
      }
    } catch (e) {
      debugPrint("Lỗi Reverse Geocoding: $e");
      // Nếu không lấy được tên địa chỉ (do lỗi mạng/Apple service),
      // vẫn trả về tọa độ để ít nhất biết đang ở đâu
      return GeoLocationResult(
        province: '',
        district: '',
        ward: '',
        street: '',
        latitude: position.latitude,
        longitude: position.longitude,
      );
    }
    return null;
  }
}

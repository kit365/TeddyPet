import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();

  LocationService._internal();

  factory LocationService() {
    return _instance;
  }

  /// Request location permissions and get current position
  /// Returns null if permission is denied or location unavailable
  Future<Position?> getCurrentLocation() async {
    try {
      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return null;
      }

      // Request permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        // User denied permission permanently, open app settings
        await Geolocator.openAppSettings();
        return null;
      }

      // Get current position
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      return position;
    } catch (e) {
      print('Error getting location: $e');
      return null;
    }
  }

  /// Get readable address from coordinates
  Future<String?> getAddressFromCoordinates(double latitude, double longitude) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(latitude, longitude);
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        // Format: District, City (e.g., Quận 1, TP. Hồ Chí Minh)
        final district = place.subAdministrativeArea ?? place.locality ?? '';
        final city = place.administrativeArea ?? '';
        
        if (district.isNotEmpty && city.isNotEmpty) {
          return "$district, $city";
        } else if (city.isNotEmpty) {
          return city;
        } else if (district.isNotEmpty) {
          return district;
        }
        return place.name;
      }
    } catch (e) {
      print('Error geocoding: $e');
    }
    return null;
  }

  /// Get formatted location string (Address or Lat,Long)
  Future<String?> getLocationString() async {
    final position = await getCurrentLocation();
    if (position != null) {
      final address = await getAddressFromCoordinates(position.latitude, position.longitude);
      if (address != null) {
        return address;
      }
      return '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
    }
    return null;
  }

  /// Check if location permissions are granted
  Future<bool> hasLocationPermission() async {
    final permission = await Geolocator.checkPermission();
    return permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always;
  }
}

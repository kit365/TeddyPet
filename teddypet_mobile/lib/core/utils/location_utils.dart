/// GPS/Location utilities for user signup and location-based features
library location_utils;

import 'package:teddypet_mobile/core/services/location_service.dart';

/// Extension to easily request and log location during signup
class SignupLocationHelper {
  static final LocationService _locationService = LocationService();

  /// Request GPS permission and get location string (latitude,longitude)
  /// Returns null if permission denied or location unavailable
  static Future<String?> requestLocationForSignup() async {
    return await _locationService.getLocationString();
  }

  /// Check if app has location permissions already
  static Future<bool> hasLocationPermission() async {
    return await _locationService.hasLocationPermission();
  }

  /// Get the current position for analytics/logging
  /// This can be used to track user registration location
  static Future<String?> getUserLocationString() async {
    return await _locationService.getLocationString();
  }
}

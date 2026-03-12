import 'package:flutter/material.dart';
import '../../../application/user/user_app_service_impl.dart';
import '../../../data/models/request/user/update_profile_request.dart';
import '../../../data/models/response/user/user_profile_response.dart';
import '../../../data/repositories/user/user_repository_impl.dart';
import '../../controllers/user/user_controller.dart';

class UserProvider extends ChangeNotifier {
  late final UserController _controller;

  UserProvider() {
    final repository = UserRepositoryImpl();
    final appService = UserAppServiceImpl(repository);
    _controller = UserController(appService);
  }

  bool _isLoading = false;
  String? _error;
  UserProfileResponse? _userProfile;

  bool get isLoading => _isLoading;
  String? get error => _error;
  UserProfileResponse? get userProfile => _userProfile;

  Future<void> getProfile() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _userProfile = await _controller.getProfile();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateProfile(UpdateProfileRequest request) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updatedProfile = await _controller.updateProfile(request);
      if (updatedProfile != null) {
        _userProfile = updatedProfile;
        return true;
      }
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearProfile() {
    _userProfile = null;
    notifyListeners();
  }
}

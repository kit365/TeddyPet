import 'package:teddypet_mobile/data/models/request/user/update_profile_request.dart';
import 'package:teddypet_mobile/data/models/response/user/user_profile_response.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../application/auth/auth_app_service_impl.dart';
import '../../../data/repositories/auth/auth_repository_impl.dart';
import '../../controllers/auth/auth_controller.dart';

class AuthProvider extends ChangeNotifier {
  late final AuthController _controller;

  AuthProvider() {
    final repository = AuthRepositoryImpl();
    final appService = AuthAppServiceImpl(repository);
    _controller = AuthController(appService);
  }
  
  bool _isLoading = false;
  String? _error;
  String? _token;
  String? _registerEmail;

  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get token => _token;
  String? get registerEmail => _registerEmail;


  Future<bool> login(String login, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final user = await _controller.login(login, password);

      if (user != null) {
        _token = user.token;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', _token!);
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = _handleError(e);
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> register(String username, String email, String password, 
      String firstName, String lastName, String? phoneNumber) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _controller.register(
        username, email, password, firstName, lastName, phoneNumber);
      if (response != null) {
        _registerEmail = email;
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = _handleError(e);
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> verifyRegisterOtp(String email, String otpCode) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final user = await _controller.verifyRegisterOtp(email, otpCode);
      if (user != null) {
        _token = user.token;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', _token!);
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = _handleError(e);
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> requestOtp(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      return await _controller.requestOtp(email);
    } catch (e) {
      _error = _handleError(e);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> verifyOtp(String otp) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final isValid = await _controller.verifyOtp(otp);
      if (!isValid) _error = 'Mã xác nhận không hợp lệ hoặc đã hết hạn';
      return isValid;
    } catch (e) {
      _error = _handleError(e);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> resetPassword(String otp, String newPassword, String confirmPassword) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      return await _controller.resetPassword(otp, newPassword, confirmPassword);
    } catch (e) {
      _error = _handleError(e);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> loginWithGoogle(String idToken) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final user = await _controller.loginWithGoogle(idToken);
      if (user != null) {
        _token = user.token;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', _token!);
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = _handleError(e);
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  String _handleError(dynamic e) {
    if (e is DioException) {
      final backendMessage = e.response?.data?['message'];
      return backendMessage?.toString() ?? 'Có lỗi xảy ra, vui lòng thử lại!';
    }
    return e.toString().replaceFirst('Exception: ', '');
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    _token = null;
    notifyListeners();
  }
}

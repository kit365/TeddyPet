// lib/core/providers/auth_provider.dart
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/models/request/auth/forgot_password_request.dart';
import '../../data/models/request/auth/login_request.dart';
import '../../data/models/request/auth/reset_password_request.dart';
import '../../data/services/auth/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  
  bool _isLoading = false;
  String? _error;
  String? _token;

  // Lấy ra để dùng ở UI
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get token => _token;

  // HÀM LOGIN CHÍNH
  Future<bool> login(String login, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners(); // Cập nhật để UI hiện Loading...

    try {
      final request = LoginRequest(usernameOrEmail: login, password: password);
      final result = await _authService.login(request);

      if (result != null) {
        _token = result.token;
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

  // 1. GỬI YÊU CẦU OTP
  Future<bool> requestOtp(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final request = ForgotPasswordRequest(email: email);
      await _authService.forgotPasswordMobile(request);
      return true;
    } catch (e) {
      _error = _handleError(e);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // 2. XÁC THỰC OTP
  Future<bool> verifyOtp(String otp) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final isValid = await _authService.verifyOtp(otp);
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

  // 3. ĐỔI MẬT KHẨU MỚI
  Future<bool> resetPassword(String otp, String newPassword, String confirmPassword) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final request = ResetPasswordRequest(
        token: otp,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      );
      await _authService.resetPassword(request);
      return true;
    } catch (e) {
      _error = _handleError(e);
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // HÀM XỬ LÝ LỖI DÙNG CHUNG
  String _handleError(dynamic e) {
    if (e is DioException) {
      final backendMessage = e.response?.data?['message'];
      return backendMessage?.toString() ?? 'Có lỗi xảy ra, vui lòng thử lại!';
    }
    return e.toString().replaceFirst('Exception: ', '');
  }

  // ĐĂNG XUẤT
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    _token = null;
    notifyListeners();
  }
}

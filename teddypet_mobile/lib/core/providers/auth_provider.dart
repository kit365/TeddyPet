// lib/core/providers/auth_provider.dart
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/models/request/auth/login_request.dart';
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
        
        // Lưu Token vào máy để dùng cho các API sau này
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', _token!);
        
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // ĐĂNG XUẤT
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    _token = null;
    notifyListeners();
  }
}

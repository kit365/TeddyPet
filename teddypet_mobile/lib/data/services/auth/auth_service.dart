import 'dart:convert';

import 'package:teddypet_mobile/core/network/api_client.dart';
import 'package:teddypet_mobile/data/models/request/auth/forgot_password_request.dart';
import 'package:teddypet_mobile/data/models/request/auth/login_request.dart';
import 'package:teddypet_mobile/data/models/request/auth/reset_password_request.dart';
import 'package:teddypet_mobile/data/models/response/auth/auth_response.dart';

class AuthService {
  final ApiClient _apiClient = ApiClient();
  final baseEndpoint = '/auth';
  late final mobileBaseEndpoint = '$baseEndpoint/mobile';

  Future<AuthResponse?> login(LoginRequest request) async {
    final response = await _apiClient.post<AuthResponse>(
      '$baseEndpoint/login', 
      data: request.toJson(),
      fromJson: (json) => AuthResponse.fromJson(json)
    );
    
    if (response.success) {
      return response.data;
    } else {
      throw Exception(response.message);
    }
  }
  
  Future<void> forgotPasswordMobile(ForgotPasswordRequest request) async {
    final response = await _apiClient.post(
      '$mobileBaseEndpoint/forgot-password', 
      data: request.toJson()
    );
    if (!response.success) throw Exception(response.message);
  }

  Future<bool> verifyOtp(String otp) async {
    final response = await _apiClient.get<bool>(
      '$baseEndpoint/validate-reset-token', 
      queryParameters: {'token': otp}
    );
    return response.success && response.data == true;
  }

  Future<void> resetPassword(ResetPasswordRequest request) async {
    final response = await _apiClient.post(
      '$baseEndpoint/reset-password', 
      data: request.toJson()
    );
    if (!response.success) throw Exception(response.message);
  }
}
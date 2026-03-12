import 'package:teddypet_mobile/core/network/api_client.dart';
import '../../models/entities/auth/user_entity.dart';
import '../../models/request/auth/forgot_password_request.dart';
import '../../models/request/auth/login_request.dart';
import '../../models/request/auth/register_request.dart';
import '../../models/request/auth/reset_password_request.dart';
import '../../models/request/auth/verify_otp_request.dart';
import '../../models/response/auth/auth_response.dart';
import '../../models/response/auth/register_response.dart';
import 'package:teddypet_mobile/core/network/api_response.dart';
import '../../models/request/user/update_profile_request.dart';
import '../../models/response/user/user_profile_response.dart';
import 'auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _apiClient = ApiClient();
  final String _baseEndpoint = '/auth';
  late final String _mobileBaseEndpoint = '$_baseEndpoint/mobile';

  @override
  Future<UserEntity?> login(String username, String password) async {
    final request = LoginRequest(usernameOrEmail: username, password: password);
    
    final response = await _apiClient.post<AuthResponse>(
      '$_baseEndpoint/login', 
      data: request.toJson(),
      fromJson: (json) => AuthResponse.fromJson(json)
    );

    if (response.success && response.data != null) {
      return _mapToEntity(response.data!);
    }
    throw Exception(response.message);
  }

  @override
  Future<RegisterResponse?> register(String username, String email, String password, String firstName, String lastName, String? phoneNumber) async {
    final request = RegisterRequest(
      username: username,
      email: email,
      password: password,
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber,
    );

    final response = await _apiClient.post<RegisterResponse>(
      '$_mobileBaseEndpoint/register',
      data: request.toJson(),
      fromJson: (json) => RegisterResponse.fromJson(json)
    );

    if (response.success) {
      return response.data;
    }
    throw Exception(response.message);
  }

  @override
  Future<UserEntity?> verifyRegisterOtp(String email, String otpCode) async {
    final request = VerifyOtpRequest(email: email, otpCode: otpCode);
    
    final response = await _apiClient.post<AuthResponse>(
      '$_mobileBaseEndpoint/verify-register-otp',
      data: request.toJson(),
      fromJson: (json) => AuthResponse.fromJson(json)
    );

    if (response.success && response.data != null) {
      return _mapToEntity(response.data!);
    }
    throw Exception(response.message);
  }

  @override
  Future<bool> forgotPassword(String email) async {
    final request = ForgotPasswordRequest(email: email);
    final response = await _apiClient.post(
      '$_mobileBaseEndpoint/forgot-password', 
      data: request.toJson()
    );
    return response.success;
  }

  @override
  Future<bool> verifyOtp(String otp) async {
    final response = await _apiClient.get<bool>(
      '$_baseEndpoint/validate-reset-token', 
      queryParameters: {'token': otp}
    );
    return response.success && response.data == true;
  }

  @override
  Future<bool> resetPassword(String otp, String newPassword, String confirmPassword) async {
    final request = ResetPasswordRequest(
      token: otp,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    );
    final response = await _apiClient.post(
      '$_baseEndpoint/reset-password', 
      data: request.toJson()
    );
    return response.success;
  }

  @override
  Future<UserEntity?> loginWithGoogle(String idToken) async {
    final response = await _apiClient.post<AuthResponse>(
      '$_baseEndpoint/google', 
      data: {'idToken': idToken},
      fromJson: (json) => AuthResponse.fromJson(json)
    );

    if (response.success && response.data != null) {
      return _mapToEntity(response.data!);
    }
    throw Exception(response.message);
  }

  UserEntity _mapToEntity(AuthResponse response) {
    return UserEntity(
      id: response.id, // Đã có ID xịn từ BE
      email: response.email,
      username: response.username,
      token: response.token,
    );
  }
}

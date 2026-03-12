import 'package:teddypet_mobile/data/models/response/auth/register_response.dart';
import 'package:teddypet_mobile/data/models/entities/auth/user_entity.dart';

abstract class AuthRepository {
  Future<UserEntity?> login(String username, String password);
  Future<bool> forgotPassword(String email);
  Future<bool> verifyOtp(String otp);
  Future<bool> resetPassword(String otp, String newPassword, String confirmPassword);
  Future<RegisterResponse?> register(String username, String email, String password, String firstName, String lastName, String? phoneNumber);
  Future<UserEntity?> verifyRegisterOtp(String email, String otpCode);
  Future<UserEntity?> loginWithGoogle(String idToken);
  
  // Change password (for logged-in users)
  Future<int> sendChangePasswordOtp();
  Future<bool> verifyChangePasswordOtp(String otpCode);
  Future<bool> changePassword(String oldPassword, String newPassword, String otpCode);
}

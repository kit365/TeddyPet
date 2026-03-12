import '../../data/models/entities/auth/user_entity.dart';
import '../../data/models/response/auth/register_response.dart';

abstract class AuthAppService {
  Future<UserEntity?> login(String username, String password);
  Future<RegisterResponse?> register(String username, String email, String password, String firstName, String lastName, String? phoneNumber);
  Future<UserEntity?> verifyRegisterOtp(String email, String otpCode);
  Future<bool> forgotPassword(String email);
  Future<bool> verifyOtp(String otp);
  Future<bool> resetPassword(String otp, String newPassword, String confirmPassword);
  Future<UserEntity?> loginWithGoogle(String idToken);
}

import '../entities/user_entity.dart';

abstract class AuthRepository {
  Future<UserEntity?> login(String username, String password);
  Future<bool> forgotPassword(String email);
  Future<bool> resetPassword(String otp, String newPassword, String confirmPassword);
}

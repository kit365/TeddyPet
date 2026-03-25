import '../../data/models/entities/auth/user_entity.dart';
import '../../data/models/response/auth/register_response.dart';
import '../../data/repositories/auth/auth_repository.dart';
import 'auth_app_service.dart';

class AuthAppServiceImpl implements AuthAppService {
  final AuthRepository _repository;

  AuthAppServiceImpl(this._repository);

  @override
  Future<UserEntity?> login(String username, String password) {
    return _repository.login(username, password);
  }

  @override
  Future<RegisterResponse?> register(String username, String email, String password, String firstName, String lastName, String? phoneNumber) {
    return _repository.register(username, email, password, firstName, lastName, phoneNumber);
  }

  @override
  Future<UserEntity?> verifyRegisterOtp(String email, String otpCode) {
    return _repository.verifyRegisterOtp(email, otpCode);
  }

  @override
  Future<bool> forgotPassword(String email) {
    return _repository.forgotPassword(email);
  }

  @override
  Future<bool> verifyOtp(String otp) {
    return _repository.verifyOtp(otp);
  }

  @override
  Future<bool> resetPassword(String otp, String newPassword, String confirmPassword) {
    return _repository.resetPassword(otp, newPassword, confirmPassword);
  }

  @override
  Future<UserEntity?> loginWithGoogle(String idToken) {
    return _repository.loginWithGoogle(idToken);
  }

  // === Change Password ===
  @override
  Future<int> sendChangePasswordOtp() {
    return _repository.sendChangePasswordOtp();
  }

  @override
  Future<bool> verifyChangePasswordOtp(String otpCode) {
    return _repository.verifyChangePasswordOtp(otpCode);
  }

  @override
  Future<bool> changePassword(String oldPassword, String newPassword, String otpCode) {
    return _repository.changePassword(oldPassword, newPassword, otpCode);
  }
}

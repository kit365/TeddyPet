import '../../../../application/auth/auth_app_service.dart';
import '../../../../data/models/entities/auth/user_entity.dart';
import '../../../../data/models/response/auth/register_response.dart';

class AuthController {
  final AuthAppService _authAppService;

  AuthController(this._authAppService);

  Future<UserEntity?> login(String username, String password) async {
    return await _authAppService.login(username, password);
  }

  Future<RegisterResponse?> register(String username, String email, String password, String firstName, String lastName, String? phoneNumber) async {
    return await _authAppService.register(username, email, password, firstName, lastName, phoneNumber);
  }

  Future<UserEntity?> verifyRegisterOtp(String email, String otpCode) async {
    return await _authAppService.verifyRegisterOtp(email, otpCode);
  }

  Future<bool> requestOtp(String email) async {
    return await _authAppService.forgotPassword(email);
  }

  Future<bool> verifyOtp(String otp) async {
    return await _authAppService.verifyOtp(otp);
  }

  Future<bool> resetPassword(String otp, String newPassword, String confirmPassword) async {
    return await _authAppService.resetPassword(otp, newPassword, confirmPassword);
  }

  Future<UserEntity?> loginWithGoogle(String idToken) async {
    return await _authAppService.loginWithGoogle(idToken);
  }

  // === Change Password ===
  Future<int> sendChangePasswordOtp() async {
    return await _authAppService.sendChangePasswordOtp();
  }

  Future<bool> verifyChangePasswordOtp(String otpCode) async {
    return await _authAppService.verifyChangePasswordOtp(otpCode);
  }

  Future<bool> changePassword(String oldPassword, String newPassword, String otpCode) async {
    return await _authAppService.changePassword(oldPassword, newPassword, otpCode);
  }
}

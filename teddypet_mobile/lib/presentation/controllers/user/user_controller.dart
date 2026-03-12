import '../../../application/user/user_app_service.dart';
import '../../../data/models/request/user/update_profile_request.dart';
import '../../../data/models/response/user/user_profile_response.dart';

class UserController {
  final UserAppService _userAppService;

  UserController(this._userAppService);

  Future<UserProfileResponse?> getProfile() async {
    return await _userAppService.getProfile();
  }

  Future<UserProfileResponse?> updateProfile(UpdateProfileRequest request) async {
    return await _userAppService.updateProfile(request);
  }
}

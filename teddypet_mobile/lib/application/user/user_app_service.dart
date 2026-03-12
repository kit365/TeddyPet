import '../../data/models/request/user/update_profile_request.dart';
import '../../data/models/response/user/user_profile_response.dart';

abstract class UserAppService {
  Future<UserProfileResponse?> getProfile();
  Future<UserProfileResponse?> updateProfile(UpdateProfileRequest request);
}

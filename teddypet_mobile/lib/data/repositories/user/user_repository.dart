import '../../models/request/user/update_profile_request.dart';
import '../../models/response/user/user_profile_response.dart';

abstract class UserRepository {
  Future<UserProfileResponse?> getProfile();
  Future<UserProfileResponse?> updateProfile(UpdateProfileRequest request);
}

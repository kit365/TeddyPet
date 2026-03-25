import '../../data/models/request/user/update_profile_request.dart';
import '../../data/models/response/user/user_profile_response.dart';
import '../../data/repositories/user/user_repository.dart';
import 'user_app_service.dart';

class UserAppServiceImpl implements UserAppService {
  final UserRepository _repository;

  UserAppServiceImpl(this._repository);

  @override
  Future<UserProfileResponse?> getProfile() {
    return _repository.getProfile();
  }

  @override
  Future<UserProfileResponse?> updateProfile(UpdateProfileRequest request) {
    return _repository.updateProfile(request);
  }
}

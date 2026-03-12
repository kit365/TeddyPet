import 'package:teddypet_mobile/data/models/request/user/update_profile_request.dart';
import 'package:teddypet_mobile/data/models/response/user/user_profile_response.dart';
import 'package:teddypet_mobile/data/repositories/user/user_repository.dart';
import '../../../core/network/api_client.dart';

class UserRepositoryImpl implements UserRepository {
  final ApiClient _apiClient = ApiClient();
  final String _baseEndpoint = '/users';

  @override
  Future<UserProfileResponse?> getProfile() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/auth/me', // BE để ở auth/me
      fromJson: (json) => json as Map<String, dynamic>,
    );

    if (response.success && response.data != null) {
      return UserProfileResponse.fromJson(response.data!);
    }
    throw Exception(response.message);
  }

  @override
  Future<UserProfileResponse?> updateProfile(UpdateProfileRequest request) async {
    final response = await _apiClient.put<Map<String, dynamic>>(
      '$_baseEndpoint/profile',
      data: request.toJson(),
      fromJson: (json) => json as Map<String, dynamic>,
    );

    if (response.success && response.data != null) {
      return UserProfileResponse.fromJson(response.data!);
    }
    throw Exception(response.message);
  }
}

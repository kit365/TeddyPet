import 'package:teddypet_mobile/core/network/api_client.dart';
import 'package:teddypet_mobile/data/models/request/user/user_address_request.dart';
import 'package:teddypet_mobile/data/models/response/user/user_address_response.dart';
import 'user_address_repository.dart';

class UserAddressRepositoryImpl implements UserAddressRepository {
  final ApiClient _apiClient = ApiClient();
  final String _baseEndpoint = '/user-addresses';

  @override
  Future<List<UserAddressResponse>> getAll() async {
    final response = await _apiClient.get<List<dynamic>>(
      _baseEndpoint,
      fromJson: (json) => json as List<dynamic>,
    );

    if (response.success && response.data != null) {
      return response.data!
          .map((item) => UserAddressResponse.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    throw Exception(response.message);
  }

  @override
  Future<UserAddressResponse?> getDetail(int id) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '$_baseEndpoint/$id',
      fromJson: (json) => json as Map<String, dynamic>,
    );

    if (response.success && response.data != null) {
      return UserAddressResponse.fromJson(response.data!);
    }
    throw Exception(response.message);
  }

  @override
  Future<void> create(UserAddressRequest request) async {
    final response = await _apiClient.post(
      _baseEndpoint,
      data: request.toJson(),
    );

    if (!response.success) {
      throw Exception(response.message);
    }
  }

  @override
  Future<void> update(int id, UserAddressRequest request) async {
    final response = await _apiClient.put(
      '$_baseEndpoint/$id',
      data: request.toJson(),
    );

    if (!response.success) {
      throw Exception(response.message);
    }
  }

  @override
  Future<void> delete(int id) async {
    final response = await _apiClient.delete('$_baseEndpoint/$id');

    if (!response.success) {
      throw Exception(response.message);
    }
  }

  @override
  Future<void> setDefault(int id) async {
    final response = await _apiClient.patch('$_baseEndpoint/$id/default');

    if (!response.success) {
      throw Exception(response.message);
    }
  }
}

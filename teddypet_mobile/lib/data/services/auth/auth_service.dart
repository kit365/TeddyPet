import 'package:teddypet_mobile/core/network/api_client.dart';
import 'package:teddypet_mobile/data/models/request/auth/login_request.dart';
import 'package:teddypet_mobile/data/models/response/auth/auth_response.dart';

class AuthService {
  final ApiClient _apiClient = ApiClient();

  Future<AuthResponse?> login(LoginRequest request) async {
    final response = await _apiClient.post<AuthResponse>('/auth/login',data: request.toJson(),fromJson: (json) => AuthResponse.fromJson(json));
    if (response.success) {
      return response.data;
    } else {
      throw Exception(response.message);
    }
  }
}
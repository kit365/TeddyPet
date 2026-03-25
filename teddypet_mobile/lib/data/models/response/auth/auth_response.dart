// lib/data/models/response/auth/auth_response.dart
class AuthResponse {
  final String id;
  final String token;
  final String username;
  final String email;
  final String? firstName;
  final String? lastName;
  final String role;
  final String? expiresAt;

  AuthResponse({
    required this.id,
    required this.token,
    required this.username,
    required this.email,
    this.firstName,
    this.lastName,
    required this.role,
    this.expiresAt,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      id: json['id']?.toString() ?? '',
      token: json['token'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      firstName: json['firstName'],
      lastName: json['lastName'],
      role: json['role'] ?? '',
      expiresAt: json['expiresAt'],
    );
  }
}

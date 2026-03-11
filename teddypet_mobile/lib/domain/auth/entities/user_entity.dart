class UserEntity {
  final String id;
  final String email;
  final String? username;
  final String? avatarUrl;
  final String? token;

  UserEntity({
    required this.id,
    required this.email,
    this.username,
    this.avatarUrl,
    this.token,
  });
}

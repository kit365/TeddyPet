class UserProfileResponse {
  final String id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String? phoneNumber;
  final String? avatarUrl;
  final String? altImage;
  final String? gender;
  final String? dateOfBirth;
  final String? createdAt;
  final String? status;
  final String? role;

  UserProfileResponse({
    required this.id,
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phoneNumber,
    this.avatarUrl,
    this.altImage,
    this.gender,
    this.dateOfBirth,
    this.createdAt,
    this.status,
    this.role,
  });

  factory UserProfileResponse.fromJson(Map<String, dynamic> json) {
    return UserProfileResponse(
      id: json['id']?.toString() ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      phoneNumber: json['phoneNumber'],
      avatarUrl: json['avatarUrl'],
      altImage: json['altImage'],
      gender: json['gender'],
      dateOfBirth: json['dateOfBirth'],
      createdAt: json['createdAt'],
      status: json['status'],
      role: json['role'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'phoneNumber': phoneNumber,
      'avatarUrl': avatarUrl,
      'altImage': altImage,
      'gender': gender,
      'dateOfBirth': dateOfBirth,
      'createdAt': createdAt,
      'status': status,
      'role': role,
    };
  }
}

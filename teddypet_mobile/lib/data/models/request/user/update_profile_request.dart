class UpdateProfileRequest {
  final String firstName;
  final String lastName;
  final String phoneNumber;
  final String? dateOfBirth;
  final String? gender; // MALE, FEMALE, OTHER

  UpdateProfileRequest({
    required this.firstName,
    required this.lastName,
    required this.phoneNumber,
    this.dateOfBirth,
    this.gender,
  });

  Map<String, dynamic> toJson() {
    return {
      'firstName': firstName,
      'lastName': lastName,
      'phoneNumber': phoneNumber,
      if (dateOfBirth != null) 'dateOfBirth': dateOfBirth,
      if (gender != null) 'gender': gender,
    };
  }
}

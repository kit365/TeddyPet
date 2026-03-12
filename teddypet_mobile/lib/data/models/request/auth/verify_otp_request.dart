class VerifyOtpRequest {
  final String email;
  final String otpCode;

  VerifyOtpRequest({
    required this.email,
    required this.otpCode,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'otpCode': otpCode,
    };
  }
}

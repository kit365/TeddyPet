class RegisterResponse {
  final String message;
  final int resendCooldownSeconds;
  final String? canResendAt;

  RegisterResponse({
    required this.message,
    required this.resendCooldownSeconds,
    this.canResendAt,
  });

  factory RegisterResponse.fromJson(Map<String, dynamic> json) {
    return RegisterResponse(
      message: json['message'] ?? '',
      resendCooldownSeconds: json['resendCooldownSeconds'] ?? 0,
      canResendAt: json['canResendAt'],
    );
  }
}

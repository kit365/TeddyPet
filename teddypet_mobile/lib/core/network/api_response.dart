class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final DateTime? timestamp;
  final int? statusCode;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.timestamp,
    this.statusCode,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic json)? fromJsonT,
  ) {
    return ApiResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: (json['data'] != null && fromJsonT != null)
          ? fromJsonT(json['data'])
          : null,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      statusCode: json['statusCode'],
    );
  }
}

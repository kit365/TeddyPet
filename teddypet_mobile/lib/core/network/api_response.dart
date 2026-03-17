class ApiResponse<T> {
  final bool success;
  final int? status;
  final String? message;
  final T? data;

  ApiResponse({
    required this.success,
    this.status,
    this.message,
    this.data,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic json)? fromJsonT,
  ) {
    final int? code = json['status'] ?? json['statusCode'];
    final bool? successField = json['success'];
    
    return ApiResponse(
      success: successField ?? (code != null && code >= 200 && code < 300),
      status: code,
      message: json['message'] ?? '',
      data: (json['data'] != null && fromJsonT != null)
          ? fromJsonT(json['data'])
          : null,
    );
  }
}

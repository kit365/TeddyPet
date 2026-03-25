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
    dynamic json,
    T Function(dynamic json)? fromJsonT,
  ) {
    if (json is List) {
      return ApiResponse(
        success: true,
        data: fromJsonT != null ? fromJsonT(json) : json as T?,
      );
    }

    if (json is! Map) {
      return ApiResponse(
        success: false,
        message: 'Invalid response format',
      );
    }

    final Map<String, dynamic> map = json as Map<String, dynamic>;
    final int? code = map['status'] ?? map['statusCode'];
    final bool? successField = map['success'];
    
    return ApiResponse(
      success: successField ?? (code != null && code >= 200 && code < 300),
      status: code,
      message: map['message'] ?? '',
      data: (map['data'] != null)
          ? (fromJsonT != null ? fromJsonT(map['data']) : map['data'] as T?)
          : null,
    );
  }
}

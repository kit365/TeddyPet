import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../domain/common/dto/api_response.dart'; 

class ApiClient {
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: dotenv.get('API_URL', fallback: 'http://localhost:8080/api'),
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        contentType: 'application/json',
      ),
    );


    _dio.interceptors.add(
      InterceptorsWrapper(
        // 1. TRƯỚC KHI GỬI ĐI (Tự động gắn Token)
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('access_token'); //luu token vao

          if (token != null && token.isNotEmpty) {
            // Tự động gắn Bearer Token vào header
            options.headers['Authorization'] = 'Bearer $token';
          }
          
          print('🚀 SENDING [${options.method}] => ${options.path}');
          return handler.next(options);
        },

        // 2. KHI NHẬN ĐƯỢC PHẢN HỒI (Xử lý dữ liệu thô)
        onResponse: (response, handler) {
          print('✅ SUCCESS [${response.statusCode}] => ${response.requestOptions.path}');
          return handler.next(response);
        },

        onError: (DioException e, handler) {
          final statusCode = e.response?.statusCode;
          final errorMessage = e.response?.data?['message'] ?? 'Lỗi không xác định';

          print('❌ ERROR [$statusCode] => ${e.requestOptions.path}');

          switch (statusCode) {
            case 401:
              print('� LỖI: Token hết hạn/Chưa login.');
              break;
            case 500:
              print('💣 LỖI: Backend đang có sự cố (Server Error).');
              break;
          }
          
          return handler.next(e);
        },
      ),
    );
  }


  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic json)? fromJson, 
  }) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      return ApiResponse<T>.fromJson(response.data, fromJson);
    } catch (e) {
      rethrow;
    }
  }

  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    T Function(dynamic json)? fromJson,
  }) async {
    try {
      final response = await _dio.post(path, data: data);
      return ApiResponse<T>.fromJson(response.data, fromJson);
    } catch (e) {
      rethrow;
    }
  }

  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    T Function(dynamic json)? fromJson,
  }) async {
    try {
      final response = await _dio.put(path, data: data);
      return ApiResponse<T>.fromJson(response.data, fromJson);
    } catch (e) {
      rethrow;
    }
  }

  Future<ApiResponse<T>> delete<T>(
    String path, {
    T Function(dynamic json)? fromJson,
  }) async {
    try {
      final response = await _dio.delete(path);
      return ApiResponse<T>.fromJson(response.data, fromJson);
    } catch (e) {
      rethrow;
    }
  }
}

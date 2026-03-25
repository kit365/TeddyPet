import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_response.dart';

class ApiClient {
  late final Dio _dio;

  ApiClient() {
    String baseUrl = dotenv.get('API_URL', fallback: 'http://localhost:8080/api/');
    
    // Auto-replace localhost with 10.0.2.2 for Android Emulator
    if (Platform.isAndroid && (baseUrl.contains('localhost') || baseUrl.contains('127.0.0.1'))) {
      baseUrl = baseUrl.replaceFirst('localhost', '10.0.2.2').replaceFirst('127.0.0.1', '10.0.2.2');
    }

    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        contentType: 'application/json',
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('access_token');

          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          
          return handler.next(options);
        },
        onResponse: (response, handler) {
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          print('--- API ERROR ---');
          print('Path: ${e.requestOptions.path}');
          print('Status Code: ${e.response?.statusCode}');
          print('Response Data: ${e.response?.data}');
          print('------------------');
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
    Map<String, dynamic>? queryParameters,
    T Function(dynamic json)? fromJson,
  }) async {
    try {
      final response = await _dio.post(path, data: data, queryParameters: queryParameters);
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

  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    T Function(dynamic json)? fromJson,
  }) async {
    try {
      final response = await _dio.patch(path, data: data);
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

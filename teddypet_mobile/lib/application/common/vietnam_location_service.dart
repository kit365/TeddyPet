import 'package:dio/dio.dart';

class VietnamLocationResponse {
  final String name;
  final int code;
  final String codename;
  final String divisionType;

  VietnamLocationResponse({
    required this.name,
    required this.code,
    required this.codename,
    required this.divisionType,
  });

  factory VietnamLocationResponse.fromJson(Map<String, dynamic> json) {
    return VietnamLocationResponse(
      name: json['name'] ?? '',
      code: json['code'] ?? 0,
      codename: json['codename'] ?? '',
      divisionType: json['division_type'] ?? '',
    );
  }
}

class VietnamLocationService {
  final Dio _dio = Dio(BaseOptions(baseUrl: 'https://provinces.open-api.vn/api'));

  Future<List<VietnamLocationResponse>> getProvinces() async {
    try {
      final response = await _dio.get('/p/');
      return (response.data as List).map((e) => VietnamLocationResponse.fromJson(e)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<List<VietnamLocationResponse>> getDistricts(int provinceCode) async {
    try {
      final response = await _dio.get('/p/$provinceCode?depth=2');
      final districts = response.data['districts'] as List;
      return districts.map((e) => VietnamLocationResponse.fromJson(e)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<List<VietnamLocationResponse>> getWards(int districtCode) async {
    try {
      final response = await _dio.get('/d/$districtCode?depth=2');
      final wards = response.data['wards'] as List;
      return wards.map((e) => VietnamLocationResponse.fromJson(e)).toList();
    } catch (e) {
      rethrow;
    }
  }
}

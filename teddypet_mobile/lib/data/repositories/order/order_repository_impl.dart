
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../models/entities/order/order_entity.dart';
import '../../models/request/order/order_request.dart';
import '../../models/response/order/order_response.dart';
import 'order_repository.dart';

class OrderRepositoryImpl implements OrderRepository {
  final ApiClient _apiClient = ApiClient();
  final String _baseEndpoint = '/orders';

  @override
  Future<OrderEntity?> createOrder(OrderRequest request) async {
    try {
      final response = await _apiClient.post<OrderResponse>(
        _baseEndpoint,
        data: request.toJson(),
        fromJson: (json) => OrderResponse.fromJson(json),
      );

      if (response.success && response.data != null) {
        return OrderEntity.fromResponse(response.data!);
      }
      return null;
    } catch (e) {
      if (e is DioException) {
        print("❌ LỖI CHI TIẾT TỪ BE: ${e.response?.data}");
      }
      print("Lỗi khi createOrder: $e");
      return null;
    }
  }
  @override
  Future<OrderEntity?> getOrderDetail(String id) async {
    try {
      final response = await _apiClient.get<OrderResponse>(
        '$_baseEndpoint/my-orders/$id',
        fromJson: (json) => OrderResponse.fromJson(json),
      );

      if (response.success && response.data != null) {
        return OrderEntity.fromResponse(response.data!);
      }
      return null;
    } catch (e) {
      print("Lỗi khi getOrderDetail: $e");
      return null;
    }
  }

  @override
  Future<OrderEntity?> getOrderByCode(String code) async {
    try {
      final response = await _apiClient.get<OrderResponse>(
        '$_baseEndpoint/my-orders/code/$code',
        fromJson: (json) => OrderResponse.fromJson(json),
      );

      if (response.success && response.data != null) {
        return OrderEntity.fromResponse(response.data!);
      }
      return null;
    } catch (e) {
      print("Lỗi khi getOrderByCode: $e");
      return null;
    }
  }
}

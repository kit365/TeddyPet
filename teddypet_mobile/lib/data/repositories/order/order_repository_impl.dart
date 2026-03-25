
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../models/entities/order/order_entity.dart';
import '../../models/request/order/order_request.dart';
import '../../models/response/order/order_response.dart';
import 'order_repository.dart';

class OrderRepositoryImpl implements OrderRepository {
  final ApiClient _apiClient = ApiClient();
  final String _baseEndpoint = 'orders';

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

  @override
  Future<List<OrderEntity>> getMyOrdersList() async {
    try {
      final response = await _apiClient.get<List<OrderResponse>>(
        '$_baseEndpoint/my-orders/list',
        fromJson: (json) => (json as List)
            .map((item) => OrderResponse.fromJson(item))
            .toList(),
      );

      if (response.success && response.data != null) {
        return response.data!
            .map((order) => OrderEntity.fromResponse(order))
            .toList();
      }
      return [];
    } catch (e) {
      print("Lỗi khi getMyOrdersList: $e");
      return [];
    }
  }

  @override
  Future<List<OrderEntity>> getMyOrdersByStatus(String status) async {
    try {
      // Lấy tất cả rồi filter theo status
      final allOrders = await getMyOrdersList();
      return allOrders
          .where((order) => order.status.toUpperCase() == status.toUpperCase())
          .toList();
    } catch (e) {
      print("Lỗi khi getMyOrdersByStatus: $e");
      return [];
    }
  }

  @override
  Future<bool> cancelOrder(String id, String reason) async {
    try {
      final response = await _apiClient.patch<void>(
        '$_baseEndpoint/$id/cancel',
        data: {'reason': reason},
      );
      return response.success;
    } catch (e) {
      if (e is DioException) {
        print("❌ LỖI CHI TIẾT TỪ BE: ${e.response?.data}");
      }
      print("Lỗi khi cancelOrder: $e");
      return false;
    }
  }

  @override
  Future<bool> confirmReceived(String id) async {
    try {
      final response = await _apiClient.patch<void>(
        '$_baseEndpoint/$id/received',
      );
      return response.success;
    } catch (e) {
      if (e is DioException) {
        print("❌ LỖI CHI TIẾT TỪ BE: ${e.response?.data}");
      }
      print("Lỗi khi confirmReceived: $e");
      return false;
    }
  }

  @override
  Future<bool> requestReturn(String id, String reason, List<String>? evidenceUrls) async {
    try {
      final response = await _apiClient.patch<void>(
        '$_baseEndpoint/$id/request-return',
        data: {
          'reason': reason,
          if (evidenceUrls != null && evidenceUrls.isNotEmpty)
            'evidenceUrls': evidenceUrls,
        },
      );
      return response.success;
    } catch (e) {
      if (e is DioException) {
        print("❌ LỖI CHI TIẾT TỪ BE: ${e.response?.data}");
      }
      print("Lỗi khi requestReturn: $e");
      return false;
    }
  }
}

import '../../models/request/order/order_request.dart';
import '../../models/entities/order/order_entity.dart';

abstract class OrderRepository {
  Future<OrderEntity?> createOrder(OrderRequest request);
  Future<OrderEntity?> getOrderDetail(String id);
  Future<OrderEntity?> getOrderByCode(String code);
  Future<List<OrderEntity>> getMyOrdersList();
  Future<List<OrderEntity>> getMyOrdersByStatus(String status);
  Future<bool> cancelOrder(String id, String reason);
  Future<bool> confirmReceived(String id);
  Future<bool> requestReturn(String id, String reason, List<String>? evidenceUrls);
}

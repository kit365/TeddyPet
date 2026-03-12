import '../../models/request/order/order_request.dart';
import '../../models/entities/order/order_entity.dart';

abstract class OrderRepository {
  Future<OrderEntity?> createOrder(OrderRequest request);
  Future<OrderEntity?> getOrderDetail(String id);
  Future<OrderEntity?> getOrderByCode(String code);
}

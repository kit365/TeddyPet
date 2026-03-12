import '../../data/models/request/order/order_request.dart';
import '../../data/models/entities/order/order_entity.dart';

abstract class OrderService {
  Future<OrderEntity?> createOrder(OrderRequest request);
  Future<OrderEntity?> getOrderDetail(String id);
  Future<OrderEntity?> getOrderByCode(String code);
}

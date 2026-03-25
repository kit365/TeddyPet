import 'order_app_service.dart';
import '../../data/repositories/order/order_repository.dart';
import '../../data/models/request/order/order_request.dart';
import '../../data/models/entities/order/order_entity.dart';

class OrderAppServiceImpl implements OrderAppService {
  final OrderRepository _repository;

  OrderAppServiceImpl(this._repository);

  @override
  Future<OrderEntity?> createOrder(OrderRequest request) async {
    return await _repository.createOrder(request);
  }

  @override
  Future<OrderEntity?> getOrderDetail(String id) async {
    return await _repository.getOrderDetail(id);
  }

  @override
  Future<OrderEntity?> getOrderByCode(String code) async {
    return await _repository.getOrderByCode(code);
  }

  @override
  Future<List<OrderEntity>> getMyOrdersList() async {
    return await _repository.getMyOrdersList();
  }

  @override
  Future<List<OrderEntity>> getMyOrdersByStatus(String status) async {
    return await _repository.getMyOrdersByStatus(status);
  }

  @override
  Future<bool> cancelOrder(String id, String reason) async {
    return await _repository.cancelOrder(id, reason);
  }

  @override
  Future<bool> confirmReceived(String id) async {
    return await _repository.confirmReceived(id);
  }

  @override
  Future<bool> requestReturn(String id, String reason, List<String>? evidenceUrls) async {
    return await _repository.requestReturn(id, reason, evidenceUrls);
  }
}

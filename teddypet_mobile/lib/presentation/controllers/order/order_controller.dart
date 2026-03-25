import '../../../application/order/order_app_service.dart';
import '../../../data/models/request/order/order_request.dart';
import '../../../data/models/entities/order/order_entity.dart';

class OrderController {
  final OrderAppService _appService;

  OrderController(this._appService);

  Future<OrderEntity?> createOrder(OrderRequest request) async {
    return await _appService.createOrder(request);
  }

  Future<OrderEntity?> getOrderDetail(String id) async {
    return await _appService.getOrderDetail(id);
  }

  Future<OrderEntity?> getOrderByCode(String code) async {
    return await _appService.getOrderByCode(code);
  }

  Future<List<OrderEntity>> getMyOrdersList() async {
    return await _appService.getMyOrdersList();
  }

  Future<List<OrderEntity>> getMyOrdersByStatus(String status) async {
    return await _appService.getMyOrdersByStatus(status);
  }

  Future<bool> cancelOrder(String id, String reason) async {
    return await _appService.cancelOrder(id, reason);
  }


  Future<bool> confirmReceived(String id) async {
    return await _appService.confirmReceived(id);
  }

  Future<bool> requestReturn(String id, String reason, List<String>? evidenceUrls) async {
    return await _appService.requestReturn(id, reason, evidenceUrls);
  }
}

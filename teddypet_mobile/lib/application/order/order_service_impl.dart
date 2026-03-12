import 'order_service.dart';
import '../../data/repositories/order/order_repository.dart';
import '../../data/models/request/order/order_request.dart';
import '../../data/models/entities/order/order_entity.dart';

class OrderServiceImpl implements OrderService {
  final OrderRepository _orderRepository;

  OrderServiceImpl(this._orderRepository);

  @override
  Future<OrderEntity?> createOrder(OrderRequest request) async {
    return await _orderRepository.createOrder(request);
  }
}

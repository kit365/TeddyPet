import 'package:flutter/material.dart';
import '../../../application/order/order_service.dart';
import '../../../data/models/request/order/order_request.dart';
import '../../../data/models/entities/order/order_entity.dart';

class OrderProvider extends ChangeNotifier {
  final OrderService _orderService;

  OrderProvider(this._orderService);

  bool _isOrdering = false;
  bool get isOrdering => _isOrdering;

  OrderEntity? _lastCreatedOrder;
  OrderEntity? get lastCreatedOrder => _lastCreatedOrder;

  Future<bool> createOrder(OrderRequest request) async {
    _isOrdering = true;
    notifyListeners();

    try {
      _lastCreatedOrder = await _orderService.createOrder(request);
      return _lastCreatedOrder != null;
    } catch (e) {
      debugPrint("Lỗi checkout: \$e");
      return false;
    } finally {
      _isOrdering = false;
      notifyListeners();
    }
  }
}

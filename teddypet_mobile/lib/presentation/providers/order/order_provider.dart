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

  OrderEntity? _currentOrderDetail;
  OrderEntity? get currentOrderDetail => _currentOrderDetail;

  bool _isLoadingDetail = false;
  bool get isLoadingDetail => _isLoadingDetail;

  Future<bool> createOrder(OrderRequest request) async {
    _isOrdering = true;
    notifyListeners();

    try {
      _lastCreatedOrder = await _orderService.createOrder(request);
      return _lastCreatedOrder != null;
    } catch (e) {
      debugPrint("Lỗi checkout: $e");
      return false;
    } finally {
      _isOrdering = false;
      notifyListeners();
    }
  }

  Future<void> fetchOrderDetail(String id) async {
    _isLoadingDetail = true;
    notifyListeners();

    try {
      _currentOrderDetail = await _orderService.getOrderDetail(id);
    } catch (e) {
      debugPrint("Lỗi khi lấy chi tiết đơn hàng: $e");
    } finally {
      _isLoadingDetail = false;
      notifyListeners();
    }
  }

  Future<void> fetchOrderByCode(String code) async {
    _isLoadingDetail = true;
    notifyListeners();

    try {
      _currentOrderDetail = await _orderService.getOrderByCode(code);
    } catch (e) {
      debugPrint("Lỗi khi lấy đơn hàng theo mã: $e");
    } finally {
      _isLoadingDetail = false;
      notifyListeners();
    }
  }
}

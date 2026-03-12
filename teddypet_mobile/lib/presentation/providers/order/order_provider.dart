import 'package:flutter/material.dart';
import '../../../data/models/request/order/order_request.dart';
import '../../../data/models/entities/order/order_entity.dart';
import '../../controllers/order/order_controller.dart';

class OrderProvider extends ChangeNotifier {
  final OrderController _controller;

  OrderProvider(this._controller);

  // ========== State cho tạo đơn hàng ==========
  bool _isOrdering = false;
  bool get isOrdering => _isOrdering;

  OrderEntity? _lastCreatedOrder;
  OrderEntity? get lastCreatedOrder => _lastCreatedOrder;

  // ========== State cho chi tiết đơn hàng ==========
  OrderEntity? _currentOrderDetail;
  OrderEntity? get currentOrderDetail => _currentOrderDetail;

  bool _isLoadingDetail = false;
  bool get isLoadingDetail => _isLoadingDetail;

  // ========== State cho danh sách đơn hàng ==========
  List<OrderEntity> _orders = [];
  List<OrderEntity> get orders => _orders;

  bool _isLoadingOrders = false;
  bool get isLoadingOrders => _isLoadingOrders;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  // ========== Tạo đơn hàng ==========
  Future<bool> createOrder(OrderRequest request) async {
    _isOrdering = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _lastCreatedOrder = await _controller.createOrder(request);
      return _lastCreatedOrder != null;
    } catch (e) {
      debugPrint("Lỗi checkout: $e");
      _errorMessage = "Không thể tạo đơn hàng. Vui lòng thử lại.";
      return false;
    } finally {
      _isOrdering = false;
      notifyListeners();
    }
  }

  // ========== Chi tiết đơn hàng ==========
  Future<void> fetchOrderDetail(String id) async {
    _isLoadingDetail = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentOrderDetail = await _controller.getOrderDetail(id);
    } catch (e) {
      debugPrint("Lỗi khi lấy chi tiết đơn hàng: $e");
      _errorMessage = "Không thể tải chi tiết đơn hàng.";
    } finally {
      _isLoadingDetail = false;
      notifyListeners();
    }
  }

  Future<void> fetchOrderByCode(String code) async {
    _isLoadingDetail = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentOrderDetail = await _controller.getOrderByCode(code);
    } catch (e) {
      debugPrint("Lỗi khi lấy đơn hàng theo mã: $e");
      _errorMessage = "Không thể tải đơn hàng.";
    } finally {
      _isLoadingDetail = false;
      notifyListeners();
    }
  }

  // ========== Danh sách đơn hàng ==========
  Future<void> fetchMyOrders({bool background = false}) async {
    if (!background) {
      _isLoadingOrders = true;
      notifyListeners();
    }
    _errorMessage = null;

    try {
      _orders = await _controller.getMyOrdersList();
    } catch (e) {
      debugPrint("Lỗi khi lấy danh sách đơn hàng: $e");
      _errorMessage = "Không thể tải danh sách đơn hàng.";
    } finally {
      if (!background) {
        _isLoadingOrders = false;
      }
      notifyListeners();
    }
  }

  /// Lấy danh sách đơn hàng theo status
  List<OrderEntity> getOrdersByStatus(String? status) {
    if (status == null || status.isEmpty) {
      return _orders; // Trả về tất cả nếu không có status
    }
    return _orders
        .where((order) => order.status.toUpperCase() == status.toUpperCase())
        .toList();
  }

  // ========== Hủy đơn hàng ==========
  Future<bool> cancelOrder(String orderId, String reason) async {
    _errorMessage = null;
    try {
      final success = await _controller.cancelOrder(orderId, reason);
      if (success) {
        // Refresh danh sách và chi tiết
        await fetchMyOrders(background: true);
        if (_currentOrderDetail?.id == orderId) {
          await fetchOrderDetail(orderId);
        }
      } else {
        _errorMessage = "Không thể hủy đơn hàng. Vui lòng thử lại.";
      }
      return success;
    } catch (e) {
      debugPrint("Lỗi khi hủy đơn hàng: $e");
      _errorMessage = "Không thể hủy đơn hàng.";
      return false;
    }
  }

  // ========== Xác nhận đã nhận hàng ==========
  Future<bool> confirmReceived(String orderId) async {
    _errorMessage = null;
    try {
      final success = await _controller.confirmReceived(orderId);
      if (success) {
        // Refresh danh sách và chi tiết
        await fetchMyOrders(background: true);
        if (_currentOrderDetail?.id == orderId) {
          await fetchOrderDetail(orderId);
        }
      } else {
        _errorMessage = "Không thể xác nhận. Vui lòng thử lại.";
      }
      return success;
    } catch (e) {
      debugPrint("Lỗi khi xác nhận đã nhận hàng: $e");
      _errorMessage = "Không thể xác nhận đã nhận hàng.";
      return false;
    }
  }

  // ========== Yêu cầu trả hàng ==========
  Future<bool> requestReturn(String orderId, String reason, {List<String>? evidenceUrls}) async {
    _errorMessage = null;
    try {
      final success = await _controller.requestReturn(orderId, reason, evidenceUrls);
      if (success) {
        // Refresh danh sách và chi tiết
        await fetchMyOrders(background: true);
        if (_currentOrderDetail?.id == orderId) {
          await fetchOrderDetail(orderId);
        }
      } else {
        _errorMessage = "Không thể gửi yêu cầu trả hàng. Vui lòng thử lại.";
      }
      return success;
    } catch (e) {
      debugPrint("Lỗi khi yêu cầu trả hàng: $e");
      _errorMessage = "Không thể gửi yêu cầu trả hàng.";
      return false;
    }
  }

  // ========== Clear state ==========
  void clearOrderDetail() {
    _currentOrderDetail = null;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

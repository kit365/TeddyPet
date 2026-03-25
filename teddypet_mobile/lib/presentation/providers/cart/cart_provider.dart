import 'package:flutter/material.dart';
import '../../../data/models/entities/cart/cart_entity.dart';
import '../../controllers/cart/cart_controller.dart';

class CartProvider extends ChangeNotifier {
  final CartController _controller;

  CartProvider(this._controller);

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  CartEntity? _cart;
  CartEntity? get cart => _cart;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  Future<void> fetchMyCart({bool background = false}) async {
    if (!background) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      _cart = await _controller.getMyCart();
    } catch (e) {
      debugPrint("Lỗi tải giỏ hàng: $e");
      _cart = null; // Clear cart on error (e.g. 401)
    } finally {
      if (!background) {
        _isLoading = false;
      }
      notifyListeners();
    }
  }

  Future<bool> addToCart(int variantId, int quantity) async {
    final success = await _controller.addToCart(variantId, quantity);
    if (success) {
      await fetchMyCart(background: true);
    }
    return success;
  }

  Future<bool> updateCartItem(int variantId, int quantity) async {
    final success = await _controller.updateCartItem(variantId, quantity);
    if (success) {
      await fetchMyCart(background: true);
    }
    return success;
  }

  Future<bool> removeMyCartItem(int variantId) async {
    final success = await _controller.removeMyCartItem(variantId);
    if (success) {
      await fetchMyCart(background: true);
    }
    return success;
  }

  /// Mua lại các sản phẩm từ đơn hàng cũ
  Future<bool> buyAgain(List<dynamic> items) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    bool allSuccess = true;

    try {
      for (var item in items) {
        // item có thể là OrderItemEntity
        final variantId = item.variantId;
        if (variantId != null) {
          final success = await _controller.addToCart(variantId, item.quantity);
          if (!success) allSuccess = false;
        }
      }
      if (allSuccess) {
        await fetchMyCart(background: true);
      }
      return allSuccess;
    } catch (e) {
      debugPrint("Lỗi khi mua lại: $e");
      _errorMessage = "Không thể mua lại một số sản phẩm. Có thể chúng đã hết hàng.";
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearCart() {
    _cart = null;
    notifyListeners();
  }
}

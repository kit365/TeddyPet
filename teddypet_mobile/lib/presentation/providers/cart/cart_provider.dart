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

  Future<void> fetchMyCart({bool background = false}) async {
    if (!background) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      _cart = await _controller.getMyCart();
    } catch (e) {
      debugPrint("Lỗi tải giỏ hàng: \$e");
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
      await fetchMyCart(background: true); // Refetch sau khi cập nhật thành công (chạy ngầm, ko hiện quay spinner)
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
}

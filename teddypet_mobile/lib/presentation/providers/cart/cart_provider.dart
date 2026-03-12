import 'package:flutter/material.dart';
import '../../../application/cart/cart_app_service.dart';
import '../../../data/models/entities/cart/cart_entity.dart';

class CartProvider extends ChangeNotifier {
  final CartAppService _cartAppService;

  CartProvider(this._cartAppService);

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
      _cart = await _cartAppService.getMyCart();
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
    final success = await _cartAppService.addToCart(variantId, quantity);
    if (success) {
      await fetchMyCart(background: true); // Refetch sau khi cập nhật thành công (chạy ngầm, ko hiện quay spinner)
    }
    return success;
  }

  Future<bool> updateCartItem(int variantId, int quantity) async {
    final success = await _cartAppService.updateCartItem(variantId, quantity);
    if (success) {
      await fetchMyCart(background: true);
    }
    return success;
  }

  Future<bool> removeMyCartItem(int variantId) async {
    final success = await _cartAppService.removeMyCartItem(variantId);
    if (success) {
      await fetchMyCart(background: true);
    }
    return success;
  }
}

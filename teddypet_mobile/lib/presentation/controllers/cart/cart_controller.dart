import '../../../application/cart/cart_app_service.dart';
import '../../../data/models/entities/cart/cart_entity.dart';

class CartController {
  final CartAppService _appService;

  CartController(this._appService);

  Future<CartEntity?> getMyCart() {
    return _appService.getMyCart();
  }

  Future<bool> addToCart(int variantId, int quantity) {
    return _appService.addToCart(variantId, quantity);
  }

  Future<bool> updateCartItem(int variantId, int quantity) {
    return _appService.updateCartItem(variantId, quantity);
  }

  Future<bool> removeMyCartItem(int variantId) {
    return _appService.removeMyCartItem(variantId);
  }
}

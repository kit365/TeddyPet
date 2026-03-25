import '../../models/entities/cart/cart_entity.dart';

abstract class CartRepository {
  Future<CartEntity?> getMyCart();
  Future<bool> addToCart(int variantId, int quantity);
  Future<bool> updateCartItem(int variantId, int quantity);
  Future<bool> removeMyCartItem(int variantId);
}

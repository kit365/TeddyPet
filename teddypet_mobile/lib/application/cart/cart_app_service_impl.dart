import '../../data/models/entities/cart/cart_entity.dart';
import '../../data/repositories/cart/cart_repository.dart';
import 'cart_app_service.dart';

class CartAppServiceImpl implements CartAppService {
  final CartRepository _repository;

  CartAppServiceImpl(this._repository);

  @override
  Future<CartEntity?> getMyCart() async {
    return await _repository.getMyCart();
  }

  @override
  Future<bool> addToCart(int variantId, int quantity) async {
    return await _repository.addToCart(variantId, quantity);
  }

  @override
  Future<bool> updateCartItem(int variantId, int quantity) async {
    return await _repository.updateCartItem(variantId, quantity);
  }

  @override
  Future<bool> removeMyCartItem(int variantId) async {
    return await _repository.removeMyCartItem(variantId);
  }
}

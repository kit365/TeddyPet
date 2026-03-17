import '../../models/response/cart/cart_response.dart';
import '../../models/entities/cart/cart_entity.dart';
import '../../../../core/network/api_client.dart';
import 'cart_repository.dart';

class CartRepositoryImpl implements CartRepository {
  final ApiClient _apiClient = ApiClient();
  final String _baseEndpoint = 'carts';

  @override
  Future<CartEntity?> getMyCart() async {
    try {
      final response = await _apiClient.get<CartResponse>(
        _baseEndpoint, // BE dùng GET /carts
        fromJson: (json) => CartResponse.fromJson(json),
      );

      if (response.success && response.data != null) {
        return CartEntity.fromResponse(response.data!);
      }
      return null;
    } catch (e) {
      print("Lỗi khi fetch giỏ hàng: \$e");
      return null;
    }
  }

  @override
  Future<bool> addToCart(int variantId, int quantity) async {
    try {
      final response = await _apiClient.post<dynamic>(
        '$_baseEndpoint/items', // BE dùng POST /carts/items
        data: {
          'variantId': variantId,
          'quantity': quantity,
        },
      );
      return response.success;
    } catch (e) {
      print("Lỗi khi addToCart: \$e");
      return false;
    }
  }

  @override
  Future<bool> updateCartItem(int variantId, int quantity) async {
    try {
      final response = await _apiClient.put<dynamic>(
        '$_baseEndpoint/items', // BE dùng PUT /carts/items
        data: {
          'variantId': variantId,
          'quantity': quantity,
        },
      );
      return response.success;
    } catch (e) {
      print("Lỗi khi updateCartItem: \$e");
      return false;
    }
  }

  @override
  Future<bool> removeMyCartItem(int variantId) async {
    try {
      final response = await _apiClient.delete<dynamic>(
        '$_baseEndpoint/items/$variantId', // BE dùng DELETE /carts/items/{variantId}
      );
      return response.success;
    } catch (e) {
      print("Lỗi khi removeMyCartItem: \$e");
      return false;
    }
  }
}



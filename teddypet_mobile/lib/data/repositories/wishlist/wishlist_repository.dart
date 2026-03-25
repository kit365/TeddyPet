import '../../../data/api/wishlist.api.dart';

abstract class WishlistRepository {
  Future<PageWishlistResponse> getMyWishlist({int page = 1, int size = 12});

  Future<void> toggleWishlist(int productId);

  Future<bool> checkWishlist(int productId);
}

class WishlistRepositoryImpl implements WishlistRepository {
  final WishlistApi _wishlistApi;

  WishlistRepositoryImpl(this._wishlistApi);

  @override
  Future<PageWishlistResponse> getMyWishlist({int page = 1, int size = 12}) async {
    final response = await _wishlistApi.getMyWishlist(page: page, size: size);
    if (response.success && response.data != null) {
      return response.data!;
    }
    throw Exception(response.message);
  }

  @override
  Future<void> toggleWishlist(int productId) async {
    final response = await _wishlistApi.toggleWishlist(productId);
    if (!response.success) {
      throw Exception(response.message);
    }
  }

  @override
  Future<bool> checkWishlist(int productId) async {
    final response = await _wishlistApi.checkWishlist(productId);
    if (response.success && response.data != null) {
      return response.data!;
    }
    throw Exception(response.message);
  }
}

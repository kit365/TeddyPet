import '../../../data/api/wishlist.api.dart';
import '../../../data/repositories/wishlist/wishlist_repository.dart';

abstract class WishlistAppService {
  Future<PageWishlistResponse> getMyWishlist({int page = 1, int size = 12});

  Future<void> toggleWishlist(int productId);

  Future<bool> checkWishlist(int productId);
}

class WishlistAppServiceImpl implements WishlistAppService {
  final WishlistRepository _repository;

  WishlistAppServiceImpl(this._repository);

  @override
  Future<PageWishlistResponse> getMyWishlist({int page = 1, int size = 12}) async {
    return _repository.getMyWishlist(page: page, size: size);
  }

  @override
  Future<void> toggleWishlist(int productId) async {
    return _repository.toggleWishlist(productId);
  }

  @override
  Future<bool> checkWishlist(int productId) async {
    return _repository.checkWishlist(productId);
  }
}

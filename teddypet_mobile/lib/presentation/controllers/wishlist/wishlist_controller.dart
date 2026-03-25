import '../../../data/api/wishlist.api.dart';
import '../../../application/wishlist/wishlist_app_service.dart';

abstract class WishlistController {
  Future<PageWishlistResponse> getMyWishlist({int page = 1, int size = 12});

  Future<void> toggleWishlist(int productId);

  Future<bool> checkWishlist(int productId);
}

class WishlistControllerImpl implements WishlistController {
  final WishlistAppService _appService;

  WishlistControllerImpl(this._appService);

  @override
  Future<PageWishlistResponse> getMyWishlist({int page = 1, int size = 12}) async {
    return _appService.getMyWishlist(page: page, size: size);
  }

  @override
  Future<void> toggleWishlist(int productId) async {
    return _appService.toggleWishlist(productId);
  }

  @override
  Future<bool> checkWishlist(int productId) async {
    return _appService.checkWishlist(productId);
  }
}

package fpt.teddypet.application.port.input.products.wishlist;

import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.response.product.wishlist.WishlistResponse;

public interface WishlistService {
    PageResponse<WishlistResponse> getMyWishlist(int page, int size);

    void toggleWishlist(Long productId);

    boolean checkWishlist(Long productId);
}

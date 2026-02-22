package fpt.teddypet.presentation.controller.product;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.response.product.wishlist.WishlistResponse;
import fpt.teddypet.application.port.input.products.wishlist.WishlistService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiConstants.BASE_API + "/wishlists")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "Wishlist API")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user wishlist", description = "Retrieves the user's wishlist items")
    public ResponseEntity<ApiResponse<PageResponse<WishlistResponse>>> getMyWishlist(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(wishlistService.getMyWishlist(page, size)));
    }

    @PostMapping("/{productId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Toggle wishlist status", description = "Adds or removes a product from the user's wishlist")
    public ResponseEntity<ApiResponse<Void>> toggleWishlist(@PathVariable Long productId) {
        wishlistService.toggleWishlist(productId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/check/{productId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Check wishlist status", description = "Checks if a product is in the user's wishlist if logged in")
    public ResponseEntity<ApiResponse<Boolean>> checkWishlist(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(wishlistService.checkWishlist(productId)));
    }
}

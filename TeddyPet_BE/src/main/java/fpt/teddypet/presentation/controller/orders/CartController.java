package fpt.teddypet.presentation.controller.orders;

import fpt.teddypet.application.constants.orders.cart.CartMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.orders.cart.AddToCartRequest;
import fpt.teddypet.application.dto.request.orders.cart.UpdateCartItemRequest;
import fpt.teddypet.application.dto.response.orders.cart.CartResponse;

import fpt.teddypet.application.port.input.orders.cart.CartService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_CART)
@RequiredArgsConstructor
@Tag(name = "Cart", description = "API quản lý giỏ hàng")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lấy giỏ hàng hiện tại", description = "Lấy toàn bộ giỏ hàng của người dùng đang đăng nhập")
    public ResponseEntity<ApiResponse<CartResponse>> getCart() {
        CartResponse cart = cartService.getCartResponse();
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    @PostMapping("/items")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Thêm sản phẩm vào giỏ hàng", description = "Thêm một sản phẩm (variant) vào giỏ hàng. Nếu sản phẩm đã tồn tại, số lượng sẽ được cộng dồn.")
    public ResponseEntity<ApiResponse<Void>> addItem(@Valid @RequestBody AddToCartRequest request) {
        cartService.addItemToCart(request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(CartMessages.MESSAGE_CART_ADD_SUCCESS));
    }

    @PutMapping("/items")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cập nhật số lượng sản phẩm", description = "Cập nhật số lượng của một sản phẩm trong giỏ hàng")
    public ResponseEntity<ApiResponse<Void>> updateItem(@Valid @RequestBody UpdateCartItemRequest request) {
        cartService.updateCartItemQuantity(request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(CartMessages.MESSAGE_CART_UPDATE_SUCCESS));
    }

    @DeleteMapping("/items/{variantId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xóa sản phẩm khỏi giỏ hàng", description = "Xóa một sản phẩm cụ thể khỏi giỏ hàng")
    public ResponseEntity<ApiResponse<Void>> removeItem(@PathVariable Long variantId) {
        cartService.removeItemFromCart(variantId);
        return ResponseEntity.ok(ApiResponse.success(CartMessages.MESSAGE_CART_REMOVE_SUCCESS));
    }

    @PostMapping("/guest/sync")
    @Operation(summary = "Đồng bộ giỏ hàng khách vãng lai", description = "Gửi danh sách sản phẩm local của khách để cập nhật giá và tồn kho mới nhất")
    public ResponseEntity<ApiResponse<CartResponse>> syncGuest(@Valid @RequestBody List<AddToCartRequest> items) {
        return ResponseEntity.ok(ApiResponse.success(cartService.syncGuestCart(items)));
    }
}

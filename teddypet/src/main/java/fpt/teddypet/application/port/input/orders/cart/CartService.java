package fpt.teddypet.application.port.input.orders.cart;

import fpt.teddypet.application.dto.request.orders.cart.AddToCartRequest;
import fpt.teddypet.application.dto.request.orders.cart.UpdateCartItemRequest;
import fpt.teddypet.application.dto.response.orders.cart.CartResponse;

public interface CartService {
    CartResponse getCartResponse();
    void addItemToCart(AddToCartRequest request);
    void updateCartItemQuantity(UpdateCartItemRequest request);
    void removeItemFromCart(Long variantId);
    void clearCart();
}

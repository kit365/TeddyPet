package fpt.teddypet.application.port.input.orders;

import fpt.teddypet.application.dto.response.orders.CartItemResponse;
import fpt.teddypet.domain.entity.ProductVariant;
import fpt.teddypet.infrastructure.persistence.mongodb.document.CartItem;

import java.util.List;

public interface CartItemService {

    CartItemResponse toResponse(CartItem cartItem, ProductVariant variant);

    List<CartItemResponse> toResponses(List<CartItem> cartItems, List<ProductVariant> variants);
}

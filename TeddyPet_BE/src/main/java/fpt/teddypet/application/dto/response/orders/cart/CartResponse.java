package fpt.teddypet.application.dto.response.orders.cart;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;

@Builder
public record CartResponse(
        Long userId,
        List<CartItemResponse> items,
        BigDecimal totalAmount,
        int totalItems
) {
}

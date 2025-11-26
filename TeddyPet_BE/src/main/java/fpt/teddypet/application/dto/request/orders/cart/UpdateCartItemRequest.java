package fpt.teddypet.application.dto.request.orders.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateCartItemRequest(
        @NotNull(message = "ID biến thể sản phẩm là bắt buộc")
        Long variantId,

        @NotNull(message = "Số lượng là bắt buộc")
        @Min(value = 1, message = "Số lượng phải lớn hơn 0")
        Integer quantity
) {
}

package fpt.teddypet.application.dto.request.orders.cart;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;


public record CartItemRequest(

        @NotNull(message = "Variant ID không được để trống")
        Long variantId,

        @NotNull
        @Min(value = 1, message = "Số lượng tối thiểu là 1")
        Integer quantity
) {
}

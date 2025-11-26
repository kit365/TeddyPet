package fpt.teddypet.application.dto.request.orders.cart;
import java.util.List;

public record CartRequest(
        String userId,

        List<CartItemRequest> items
) {


}

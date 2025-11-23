package fpt.teddypet.application.mapper.orders;
import fpt.teddypet.application.dto.response.orders.CartItemResponse;
import fpt.teddypet.application.dto.response.orders.CartResponse;
import fpt.teddypet.infrastructure.persistence.mongodb.document.Cart;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.math.BigDecimal;
import java.util.List;


@Mapper(componentModel = "spring")
public interface CartMapper {

    @Mapping(target = "userId", expression = "java(parseUserId(cart.getUserId()))")
    @Mapping(target = "items", source = "items")
    @Mapping(target = "totalAmount", source = "totalAmount")
    @Mapping(target = "totalItems", source = "totalItems")
    CartResponse toResponse(Cart cart, List<CartItemResponse> items, BigDecimal totalAmount, int totalItems);

    default Long parseUserId(String userId) {
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

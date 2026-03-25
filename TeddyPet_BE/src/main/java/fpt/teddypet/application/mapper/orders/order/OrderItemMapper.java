package fpt.teddypet.application.mapper.orders.order;
import fpt.teddypet.application.dto.request.orders.order.OrderItemRequest;
import fpt.teddypet.application.dto.response.orders.order.OrderItemResponse;

import fpt.teddypet.domain.entity.OrderItem;
import fpt.teddypet.domain.entity.ProductVariant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface OrderItemMapper {

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "variantId", source = "variant.variantId")
    OrderItemResponse toResponse(OrderItem orderItem);


    @Mapping(target = "id", ignore = true)
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "product", source = "productVariant.product")
    @Mapping(target = "variant", source = "productVariant")
    @Mapping(target = "quantity", source = "orderItemRequest.quantity")
    @Mapping(target = "sku", ignore = true) // Service extracts from variant.sku value object
    OrderItem toEntity(OrderItemRequest orderItemRequest, ProductVariant productVariant);
}

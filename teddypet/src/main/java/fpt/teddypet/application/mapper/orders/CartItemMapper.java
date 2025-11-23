package fpt.teddypet.application.mapper.orders;

import fpt.teddypet.application.dto.response.orders.CartItemResponse;
import org.mapstruct.Mapper;

import java.math.BigDecimal;


@Mapper(componentModel = "spring")
public interface CartItemMapper {

    default CartItemResponse toResponse(
            Long variantId,
            String sku,
            String productName,
            String variantName,
            String featuredImageUrl,
            String altImage,
            BigDecimal price,
            BigDecimal salePrice,
            BigDecimal finalPrice,
            Integer quantity,
            BigDecimal subTotal,
            Integer stockQuantity,
            boolean isAvailable
    ) {
        return CartItemResponse.builder()
                .variantId(variantId)
                .sku(sku)
                .productName(productName)
                .variantName(variantName)
                .featuredImageUrl(featuredImageUrl)
                .altImage(altImage)
                .price(price)
                .salePrice(salePrice)
                .finalPrice(finalPrice)
                .quantity(quantity)
                .subTotal(subTotal)
                .stockQuantity(stockQuantity)
                .isAvailable(isAvailable)
                .build();
    }
}

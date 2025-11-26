package fpt.teddypet.application.dto.response.orders.cart;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record CartItemResponse(
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
}

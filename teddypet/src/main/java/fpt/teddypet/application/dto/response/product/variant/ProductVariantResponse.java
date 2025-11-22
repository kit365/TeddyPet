package fpt.teddypet.application.dto.response.product.variant;

import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeValueResponse;
import fpt.teddypet.domain.enums.UnitEnum;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProductVariantResponse(
        Long variantId,
        Long productId,
        String productName,
        String productSlug,
        String name,
        Integer weight,
        Integer length,
        Integer width,
        Integer height,
        BigDecimal price,
        BigDecimal salePrice,
        Integer stockQuantity,
        UnitEnum unit,
        Long featuredImageId,
        String featuredImageUrl,
        List<ProductAttributeValueResponse> attributes,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}


package fpt.teddypet.application.dto.response;

import fpt.teddypet.domain.enums.UnitEnum;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
        String sku,
        Integer stockQuantity,
        UnitEnum unit,
        Long featuredImageId,
        String featuredImageUrl,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}


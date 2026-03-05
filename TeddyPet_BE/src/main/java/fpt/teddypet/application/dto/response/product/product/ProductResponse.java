package fpt.teddypet.application.dto.response.product.product;

import fpt.teddypet.application.dto.response.product.brand.ProductBrandInfo;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryInfo;
import fpt.teddypet.application.dto.response.product.tag.ProductTagInfo;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.application.dto.response.product.image.ProductImageInfo;
import fpt.teddypet.domain.enums.ProductTypeEnum;
import fpt.teddypet.domain.enums.StockStatusEnum;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponse(
        Long productId,
        String slug,
        String name,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        ProductStatusEnum status,
        ProductTypeEnum productType,
        StockStatusEnum stockStatus,
        List<ProductCategoryInfo> categories,
        List<ProductTagInfo> tags,
        ProductBrandInfo brand,
        List<ProductImageInfo> images,
        @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss") java.time.LocalDateTime createdAt,
        List<ProductVariantResponse> variants) {
}

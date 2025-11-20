package fpt.teddypet.application.dto.response.product.product;

import fpt.teddypet.application.dto.response.product.brand.ProductBrandInfo;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryInfo;
import fpt.teddypet.application.dto.response.product.tag.ProductTagInfo;
import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeInfo;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProductResponse(
        Long productId,
        String slug,
        String barcode,
        String name,
        String description,
        String metaTitle,
        String metaDescription,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        String origin,
        String material,
        Integer viewCount,
        Integer soldCount,
        List<PetTypeEnum> petTypes,
        ProductStatusEnum status,
        List<ProductCategoryInfo> categories,
        List<ProductTagInfo> tags,
        List<ProductAgeRangeInfo> ageRanges,
        ProductBrandInfo brand,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}


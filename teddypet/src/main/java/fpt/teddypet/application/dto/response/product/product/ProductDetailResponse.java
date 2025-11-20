package fpt.teddypet.application.dto.response.product.product;
import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeInfo;
import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeInfo;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandInfo;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryInfo;
import fpt.teddypet.application.dto.response.product.image.ProductImageInfo;
import fpt.teddypet.application.dto.response.product.tag.ProductTagInfo;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Builder(toBuilder = true)
public record ProductDetailResponse(
        Long id,
        String name,
        String description,
        String content,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Integer viewCount,
        Integer soldCount,
        Float averageRating,
        Integer ratingCount,
        ProductBrandInfo brand,
        List<ProductCategoryInfo> categories,
        List<ProductTagInfo> tags,
        List<ProductAgeRangeInfo> ageRanges,
        List<ProductAttributeInfo> attribute,
        List<ProductVariantResponse> variants,
        List<ProductImageInfo> images,
        String metaTitle,
        String metaDescription,
        String origin,
        String material,
        ProductStatusEnum status,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt
) {
}


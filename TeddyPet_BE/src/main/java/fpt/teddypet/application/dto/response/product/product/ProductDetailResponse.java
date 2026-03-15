package fpt.teddypet.application.dto.response.product.product;

import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeInfo;
import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeInfo;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandInfo;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryInfo;
import fpt.teddypet.application.dto.response.product.image.ProductImageInfo;
import fpt.teddypet.application.dto.response.product.tag.ProductTagInfo;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.domain.enums.ProductTypeEnum;
import fpt.teddypet.domain.enums.StockStatusEnum;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Builder(toBuilder = true)
public record ProductDetailResponse(
                Long id,
                String slug,
                String name,
                String description,
                String content,
                String barcode,
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
                List<ProductAttributeInfo> attributes,
                List<ProductVariantResponse> variants,
                List<ProductImageInfo> images,
                String metaTitle,
                String metaDescription,
                String origin,
                String material,
                List<fpt.teddypet.domain.enums.PetTypeEnum> petTypes,
                ProductStatusEnum status,
                ProductTypeEnum productType,
                StockStatusEnum stockStatus,
                boolean isActive,
                boolean isDeleted,
                LocalDateTime createdAt) {
}

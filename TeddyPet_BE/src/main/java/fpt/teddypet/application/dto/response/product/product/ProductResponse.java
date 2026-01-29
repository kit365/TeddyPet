package fpt.teddypet.application.dto.response.product.product;

import fpt.teddypet.application.dto.response.product.brand.ProductBrandInfo;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryInfo;
import fpt.teddypet.application.dto.response.product.tag.ProductTagInfo;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.application.dto.response.product.image.ProductImageInfo;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponse(
                Long productId,
                String slug,
                String name,
                BigDecimal minPrice,
                BigDecimal maxPrice,
                ProductStatusEnum status,
                List<ProductCategoryInfo> categories,
                List<ProductTagInfo> tags,
                ProductBrandInfo brand,
                List<ProductImageInfo> images) {
}

package fpt.teddypet.application.mapper;

import fpt.teddypet.application.dto.request.ProductVariantRequest;
import fpt.teddypet.application.dto.response.ProductVariantResponse;
import fpt.teddypet.domain.entity.ProductVariant;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProductVariantMapper {

    @Mapping(target = "variantId", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "featuredImage", ignore = true)
    @Mapping(target = "price", ignore = true)
    @Mapping(target = "sku", ignore = true)
    @Mapping(target = "stockQuantity", ignore = true)
    @Mapping(target = "dimensions", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateVariantFromRequest(ProductVariantRequest request, @MappingTarget ProductVariant variant);

    @Mapping(target = "variantId", source = "variantId")
    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "productSlug", source = "product.slug")
    @Mapping(target = "weight", source = "dimensions.weight")
    @Mapping(target = "length", source = "dimensions.length")
    @Mapping(target = "width", source = "dimensions.width")
    @Mapping(target = "height", source = "dimensions.height")
    @Mapping(target = "price", source = "price.amount")
    @Mapping(target = "salePrice", source = "price.saleAmount")
    @Mapping(target = "sku", source = "sku.value")
    @Mapping(target = "stockQuantity", source = "stockQuantity.value")
    @Mapping(target = "featuredImageId", source = "featuredImage.id")
    @Mapping(target = "featuredImageUrl", source = "featuredImage.imageUrl")
    ProductVariantResponse toResponse(ProductVariant variant);
}


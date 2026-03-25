package fpt.teddypet.application.mapper.products;

import fpt.teddypet.application.dto.request.products.brand.ProductBrandRequest;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandResponse;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandHomeResponse;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandInfo;
import fpt.teddypet.domain.entity.ProductBrand;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProductBrandMapper {

    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "altImage", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateBrandFromRequest(ProductBrandRequest request, @MappingTarget ProductBrand brand);

    @Mapping(target = "brandId", source = "id")
    @Mapping(target = "slug", source = "slug")
    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    ProductBrandResponse toResponse(ProductBrand brand);

    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    ProductBrandInfo toInfo(ProductBrand brand);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    @Mapping(target = "slug", source = "slug")
    @Mapping(target = "productCount", expression = "java(brand.getProducts() != null ? (long) brand.getProducts().size() : 0L)")
    ProductBrandHomeResponse toHomeResponse(ProductBrand brand);
}

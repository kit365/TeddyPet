package fpt.teddypet.application.mapper;

import fpt.teddypet.application.dto.request.ProductBrandRequest;
import fpt.teddypet.application.dto.response.ProductBrandResponse;
import fpt.teddypet.domain.entity.ProductBrand;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProductBrandMapper {

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
    ProductBrandResponse toResponse(ProductBrand brand);
}


package fpt.teddypet.application.mapper;

import fpt.teddypet.application.dto.request.ProductImageRequest;
import fpt.teddypet.application.dto.response.ProductImageResponse;
import fpt.teddypet.domain.entity.ProductImage;
import org.mapstruct.*;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProductImageMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "product", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateImageFromRequest(ProductImageRequest request, @MappingTarget ProductImage image);

    @Mapping(target = "imageId", source = "id")
    @Mapping(target = "productId", source = "product.id")
    ProductImageResponse toResponse(ProductImage image);
}


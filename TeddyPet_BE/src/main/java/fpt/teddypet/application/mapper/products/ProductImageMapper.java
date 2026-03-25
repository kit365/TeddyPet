package fpt.teddypet.application.mapper.products;

import fpt.teddypet.application.dto.request.products.image.ProductImageRequest;
import fpt.teddypet.application.dto.response.product.image.ProductImageInfo;
import fpt.teddypet.application.dto.response.product.image.ProductImageResponse;
import fpt.teddypet.domain.entity.ProductImage;
import org.mapstruct.*;

import java.util.List;

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
    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    ProductImageResponse toResponse(ProductImage image);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "imageUrl", source = "imageUrl")
    @Mapping(target = "alt", source = "altText")
    ProductImageInfo toInfo(ProductImage image);

    List<ProductImageInfo> toInfoList(List<ProductImage> images);
}

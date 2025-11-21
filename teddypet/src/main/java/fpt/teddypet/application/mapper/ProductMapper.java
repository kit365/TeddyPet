package fpt.teddypet.application.mapper;

import fpt.teddypet.application.dto.request.product.product.ProductRequest;
import fpt.teddypet.application.dto.response.product.product.ProductDetailResponse;
import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.domain.entity.Product;
import org.mapstruct.*;

import java.util.List;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,

        uses = {
                ProductCategoryMapper.class,
                ProductBrandMapper.class,
                ProductTagMapper.class,
                ProductAgeRangeMapper.class,
                ProductVariantMapper.class,
                ProductImageMapper.class,
                ProductAttributeMapper.class
        }
)
public interface ProductMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "barcode", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "ratings", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "ageRanges", ignore = true)
    @Mapping(target = "brand", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "soldCount", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateProductFromRequest(ProductRequest request, @MappingTarget Product product);

    @Mapping(target = "productId", source = "id")
    ProductResponse toResponse(Product product);

    List<ProductResponse> toResponseList(List<Product> products);

    @Mapping(target = "brand", ignore = true)
    @Mapping(target = "categories", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "ageRanges", ignore = true)
    @Mapping(target = "attribute", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    ProductDetailResponse toDetailResponse(Product product);


}


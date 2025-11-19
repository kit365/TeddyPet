package fpt.teddypet.application.mapper;

import fpt.teddypet.application.dto.request.product.ProductRequest;
import fpt.teddypet.application.dto.response.product.ProductResponse;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandInfo;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryInfo;
import fpt.teddypet.application.dto.response.product.tag.ProductTagInfo;
import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeInfo;
import fpt.teddypet.domain.entity.Product;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
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
    @Mapping(target = "categories", expression = "java(product.getCategories() != null ? product.getCategories().stream().map(c -> new ProductCategoryInfo(c.getId(), c.getName())).collect(java.util.stream.Collectors.toList()) : java.util.Collections.emptyList())")
    @Mapping(target = "tags", expression = "java(product.getTags() != null ? product.getTags().stream().map(t -> new ProductTagInfo(t.getId(), t.getName(), t.getColor())).collect(java.util.stream.Collectors.toList()) : java.util.Collections.emptyList())")
    @Mapping(target = "ageRanges", expression = "java(product.getAgeRanges() != null ? product.getAgeRanges().stream().map(a -> new ProductAgeRangeInfo(a.getId(), a.getName())).collect(java.util.stream.Collectors.toList()) : java.util.Collections.emptyList())")
    @Mapping(target = "brand", expression = "java(product.getBrand() != null ? new ProductBrandInfo(product.getBrand().getId(), product.getBrand().getName()) : null)")
    ProductResponse toResponse(Product product);

    List<ProductResponse> toResponseList(List<Product> products);
}


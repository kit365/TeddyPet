package fpt.teddypet.application.mapper.products;

import fpt.teddypet.application.dto.request.products.category.ProductCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryResponse;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryHomeResponse;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryNestedResponse;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryInfo;
import fpt.teddypet.domain.entity.ProductCategory;
import org.mapstruct.*;
import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProductCategoryMapper {

    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "altImage", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "children", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateCategoryFromRequest(ProductCategoryUpsertRequest request, @MappingTarget ProductCategory category);

    @Mapping(target = "categoryId", source = "id")
    @Mapping(target = "slug", source = "slug")
    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "parentName", source = "parent.name")
    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    ProductCategoryResponse toResponse(ProductCategory category);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "name", source = "name")
    @Mapping(target = "slug", source = "slug")
    @Mapping(target = "productCount", expression = "java(category.getProducts() != null ? (long) category.getProducts().size() : 0L)")
    ProductCategoryHomeResponse toHomeResponse(ProductCategory category);

    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "parentName", source = "parent.name")
    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    ProductCategoryInfo toInfo(ProductCategory category);

    List<ProductCategoryInfo> toInfoList(List<ProductCategory> categories);

    @Mapping(target = "categoryId", source = "id")
    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "isDeleted", source = "deleted")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "children", ignore = true)
    ProductCategoryNestedResponse toNestedResponse(ProductCategory category);

    List<ProductCategoryNestedResponse> toNestedResponseList(List<ProductCategory> categories);
}

package fpt.teddypet.application.mapper;

import fpt.teddypet.application.dto.request.ProductCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.ProductCategoryResponse;
import fpt.teddypet.application.dto.response.ProductCategoryNestedResponse;
import fpt.teddypet.domain.entity.ProductCategory;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProductCategoryMapper {

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
    @Mapping(target = "parentId", source = "parent.id")
    ProductCategoryResponse toResponse(ProductCategory category);

    @Mapping(target = "categoryId", source = "id")
    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "children", ignore = true)
    ProductCategoryNestedResponse toNestedResponse(ProductCategory category);

    List<ProductCategoryNestedResponse> toNestedResponseList(List<ProductCategory> categories);
}


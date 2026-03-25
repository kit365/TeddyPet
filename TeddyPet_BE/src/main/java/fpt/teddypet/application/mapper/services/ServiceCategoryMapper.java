package fpt.teddypet.application.mapper.services;

import fpt.teddypet.application.dto.request.services.category.ServiceCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.service.category.ServiceCategoryInfo;
import fpt.teddypet.application.dto.response.service.category.ServiceCategoryNestedResponse;
import fpt.teddypet.application.dto.response.service.category.ServiceCategoryResponse;
import fpt.teddypet.domain.entity.ServiceCategory;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ServiceCategoryMapper {

    @Mapping(target = "categoryId", source = "id")
    @Mapping(target = "categoryName", source = "categoryName")
    @Mapping(target = "imageUrl", source = "imageURL")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "isDeleted", source = "deleted")
    @Mapping(target = "parentId", source = "parent.id")
    ServiceCategoryResponse toResponse(ServiceCategory entity);

    @Mapping(target = "categoryId", source = "id")
    @Mapping(target = "categoryName", source = "categoryName")
    @Mapping(target = "imageUrl", source = "imageURL")
    @Mapping(target = "isActive", source = "active")
    ServiceCategoryInfo toInfo(ServiceCategory entity);

    @Mapping(target = "categoryId", source = "id")
    @Mapping(target = "categoryName", source = "categoryName")
    @Mapping(target = "imageUrl", source = "imageURL")
    @Mapping(target = "children", source = "children")
    @Mapping(target = "isActive", source = "active")
    ServiceCategoryNestedResponse toNestedResponse(ServiceCategory entity);

    List<ServiceCategoryNestedResponse> toNestedResponseList(List<ServiceCategory> entities);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "children", ignore = true)
    @Mapping(target = "services", ignore = true)
    @Mapping(target = "categoryName", source = "name")
    @Mapping(target = "imageURL", source = "imageUrl")
    @Mapping(target = "colorCode", source = "colorCode")
    @Mapping(target = "active", source = "isActive")
    @Mapping(target = "deleted", ignore = true)
    void updateCategoryFromRequest(ServiceCategoryUpsertRequest request, @MappingTarget ServiceCategory entity);
}

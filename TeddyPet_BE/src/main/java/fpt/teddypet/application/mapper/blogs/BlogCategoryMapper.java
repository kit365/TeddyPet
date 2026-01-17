package fpt.teddypet.application.mapper.blogs;

import fpt.teddypet.application.dto.request.blogs.category.BlogCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryInfo;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryNestedResponse;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryResponse;
import fpt.teddypet.domain.entity.BlogCategory;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BlogCategoryMapper {

    @Mapping(target = "categoryId", source = "id")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "isDeleted", source = "deleted")
    @Mapping(target = "parentId", source = "parent.id")
    BlogCategoryResponse toResponse(BlogCategory blogCategory);

    @Mapping(target = "categoryId", source = "id")
    @Mapping(target = "isActive", source = "active")
    BlogCategoryInfo toInfo(BlogCategory blogCategory);

    @Mapping(target = "categoryId", source = "id")
    @Mapping(target = "children", source = "children")
    @Mapping(target = "isActive", source = "active")
    BlogCategoryNestedResponse toNestedResponse(BlogCategory blogCategory);

    List<BlogCategoryNestedResponse> toNestedResponseList(List<BlogCategory> blogCategories);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "children", ignore = true)
    @Mapping(target = "blogPosts", ignore = true)
    @Mapping(target = "active", source = "isActive")
    @Mapping(target = "deleted", ignore = true)
    void updateCategoryFromRequest(BlogCategoryUpsertRequest request, @MappingTarget BlogCategory category);
}

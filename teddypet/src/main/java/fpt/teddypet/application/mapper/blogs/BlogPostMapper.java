package fpt.teddypet.application.mapper.blogs;

import fpt.teddypet.application.dto.request.blogs.post.BlogPostCreateRequest;
import fpt.teddypet.application.dto.request.blogs.post.BlogPostUpdateRequest;
import fpt.teddypet.application.dto.response.blog.post.BlogPostListResponse;
import fpt.teddypet.application.dto.response.blog.post.BlogPostResponse;
import fpt.teddypet.domain.entity.BlogPost;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {BlogCategoryMapper.class, BlogTagMapper.class})
public interface BlogPostMapper {

    @Mapping(target = "isDeleted", source = "deleted")
    @Mapping(target = "parentId", source = "parent.id")
    BlogPostResponse toResponse(BlogPost blogPost);

    @Mapping(target = "category", source = "category")
    BlogPostListResponse toListResponse(BlogPost blogPost);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "children", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    void updatePostFromCreateRequest(BlogPostCreateRequest request, @MappingTarget BlogPost blogPost);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "viewCount", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "children", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    void updatePostFromUpdateRequest(BlogPostUpdateRequest request, @MappingTarget BlogPost blogPost);
}

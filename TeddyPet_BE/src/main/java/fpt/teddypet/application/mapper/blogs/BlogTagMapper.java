package fpt.teddypet.application.mapper.blogs;

import fpt.teddypet.application.dto.request.blogs.tag.BlogTagUpsertRequest;
import fpt.teddypet.application.dto.response.blog.tag.BlogTagInfo;
import fpt.teddypet.application.dto.response.blog.tag.BlogTagResponse;
import fpt.teddypet.domain.entity.BlogTag;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BlogTagMapper {

    @Mapping(target = "tagId", source = "id")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "isDeleted", source = "deleted")
    BlogTagResponse toResponse(BlogTag blogTag);

    @Mapping(target = "tagId", source = "id")
    @Mapping(target = "isActive", source = "active")
    BlogTagInfo toInfo(BlogTag blogTag);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "blogPosts", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateTagFromRequest(BlogTagUpsertRequest request, @MappingTarget BlogTag blogTag);
}

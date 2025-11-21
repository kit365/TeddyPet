package fpt.teddypet.application.mapper;

import fpt.teddypet.application.dto.request.product.tag.ProductTagRequest;
import fpt.teddypet.application.dto.response.product.tag.ProductTagResponse;
import fpt.teddypet.application.dto.response.product.tag.ProductTagInfo;
import fpt.teddypet.domain.entity.ProductTag;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProductTagMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateTagFromRequest(ProductTagRequest request, @MappingTarget ProductTag tag);

    @Mapping(target = "tagId", source = "id")
    ProductTagResponse toResponse(ProductTag tag);

    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    ProductTagInfo toInfo(ProductTag tag);

    List<ProductTagInfo> toInfoList(List<ProductTag> tags);
}


package fpt.teddypet.application.mapper;

import fpt.teddypet.application.dto.request.product.agerange.ProductAgeRangeRequest;
import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeResponse;
import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeInfo;
import fpt.teddypet.domain.entity.ProductAgeRange;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProductAgeRangeMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "products", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateAgeRangeFromRequest(ProductAgeRangeRequest request, @MappingTarget ProductAgeRange ageRange);

    @Mapping(target = "ageRangeId", source = "id")
    ProductAgeRangeResponse toResponse(ProductAgeRange ageRange);


    @Mapping(source = "deleted", target = "isDeleted")
    @Mapping(source = "active", target = "isActive")
    ProductAgeRangeInfo toInfo(ProductAgeRange ageRange);

    List<ProductAgeRangeInfo> toInfoList(List<ProductAgeRange> ageRanges);
}


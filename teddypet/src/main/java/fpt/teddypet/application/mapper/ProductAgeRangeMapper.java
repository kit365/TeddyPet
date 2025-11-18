package fpt.teddypet.application.mapper;

import fpt.teddypet.application.dto.request.ProductAgeRangeRequest;
import fpt.teddypet.application.dto.response.ProductAgeRangeResponse;
import fpt.teddypet.domain.entity.ProductAgeRange;
import org.mapstruct.*;

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
}


package fpt.teddypet.application.mapper.shop;

import fpt.teddypet.application.dto.request.shop.ShopOperationHourUpsertRequest;
import fpt.teddypet.application.dto.response.shop.ShopOperationHourResponse;
import fpt.teddypet.domain.entity.ShopOperationHour;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ShopOperationHourMapper {

    ShopOperationHourResponse toResponse(ShopOperationHour entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    void updateFromRequest(ShopOperationHourUpsertRequest request, @MappingTarget ShopOperationHour entity);
}

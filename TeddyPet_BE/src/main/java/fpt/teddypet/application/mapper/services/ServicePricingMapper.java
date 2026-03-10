package fpt.teddypet.application.mapper.services;

import fpt.teddypet.application.dto.request.services.pricing.ServicePricingUpsertRequest;
import fpt.teddypet.application.dto.response.service.pricing.ServicePricingInfo;
import fpt.teddypet.application.dto.response.service.pricing.ServicePricingResponse;
import fpt.teddypet.domain.entity.ServicePricing;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ServicePricingMapper {

    @Mapping(target = "pricingId", source = "id")
    @Mapping(target = "serviceId", source = "service.id")
    @Mapping(target = "roomTypeId", source = "roomType.id")
    @Mapping(target = "roomTypeName", source = "roomType.typeName")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "isDeleted", source = "deleted")
    ServicePricingResponse toResponse(ServicePricing entity);

    @Mapping(target = "pricingId", source = "id")
    @Mapping(target = "serviceId", source = "service.id")
    @Mapping(target = "isActive", source = "active")
    ServicePricingInfo toInfo(ServicePricing entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "service", ignore = true)
    @Mapping(target = "roomType", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "priority", defaultExpression = "java(0)")
    @Mapping(target = "active", source = "isActive")
    @Mapping(target = "deleted", ignore = true)
    void updateFromRequest(ServicePricingUpsertRequest request, @MappingTarget ServicePricing entity);
}

package fpt.teddypet.application.mapper.services;

import fpt.teddypet.application.dto.request.services.service.ServiceUpsertRequest;
import fpt.teddypet.application.dto.response.service.service.ServiceInfo;
import fpt.teddypet.application.dto.response.service.service.ServiceResponse;
import fpt.teddypet.domain.entity.Service;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ServiceMapper {

    @Mapping(target = "serviceId", source = "id")
    @Mapping(target = "serviceCategoryId", source = "serviceCategory.id")
    @Mapping(target = "serviceName", source = "serviceName")
    @Mapping(target = "imageURL", source = "imageURL")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "isDeleted", source = "deleted")
    @Mapping(target = "isRequiredRoom", source = "isRequiredRoom")
    ServiceResponse toResponse(Service entity);

    @Mapping(target = "serviceId", source = "id")
    @Mapping(target = "serviceName", source = "serviceName")
    @Mapping(target = "imageURL", source = "imageURL")
    @Mapping(target = "isActive", source = "active")
    ServiceInfo toInfo(Service entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "serviceCategory", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "comboItems", ignore = true)
    @Mapping(target = "pricingRules", ignore = true)
    // basePrice is derived from ServicePricing (min active price) and should not be manually set via upsert
    @Mapping(target = "basePrice", ignore = true)
    @Mapping(target = "shortDescription", source = "shortDescription")
    @Mapping(target = "bufferTime", defaultExpression = "java(15)")
    @Mapping(target = "advanceBookingHours", defaultExpression = "java(24)")
    @Mapping(target = "requiresVaccination", defaultExpression = "java(false)")
    @Mapping(target = "displayOrder", defaultExpression = "java(0)")
    @Mapping(target = "isPopular", defaultExpression = "java(false)")
    @Mapping(target = "isAddon", defaultExpression = "java(false)")
    @Mapping(target = "isCritical", defaultExpression = "java(false)")
    @Mapping(target = "active", source = "isActive")
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "priceUnit", ignore = true)
    @Mapping(target = "isRequiredRoom", defaultExpression = "java(false)")
    void updateServiceFromRequest(ServiceUpsertRequest request, @MappingTarget Service entity);
}

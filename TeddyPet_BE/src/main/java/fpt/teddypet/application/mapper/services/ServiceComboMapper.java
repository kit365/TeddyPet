package fpt.teddypet.application.mapper.services;

import fpt.teddypet.application.dto.request.services.combo.ServiceComboUpsertRequest;
import fpt.teddypet.application.dto.response.service.combo.ServiceComboDetailResponse;
import fpt.teddypet.application.dto.response.service.combo.ServiceComboItemResponse;
import fpt.teddypet.application.dto.response.service.combo.ServiceComboResponse;
import fpt.teddypet.domain.entity.ServiceCombo;
import fpt.teddypet.domain.entity.ServiceComboService;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ServiceComboMapper {

    @Mapping(target = "comboId", source = "id")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "isDeleted", source = "deleted")
    @Mapping(target = "serviceItems", source = "serviceItems", qualifiedByName = "comboItemsToResponse")
    ServiceComboResponse toResponse(ServiceCombo entity);

    @Mapping(target = "comboId", source = "id")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "isDeleted", source = "deleted")
    @Mapping(target = "serviceItems", source = "serviceItems", qualifiedByName = "comboItemsToResponse")
    ServiceComboDetailResponse toDetailResponse(ServiceCombo entity);

    @Named("comboItemsToResponse")
    default List<ServiceComboItemResponse> comboItemsToResponse(List<ServiceComboService> items) {
        if (items == null) return List.of();
        return items.stream()
                .map(this::toItemResponse)
                .toList();
    }

    @Mapping(target = "serviceId", source = "service.id")
    @Mapping(target = "serviceCode", source = "service.code")
    @Mapping(target = "serviceName", source = "service.serviceName")
    @Mapping(target = "serviceActive", source = "service.active")
    ServiceComboItemResponse toItemResponse(ServiceComboService item);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "serviceItems", ignore = true)
    @Mapping(target = "comboName", source = "comboName")
    @Mapping(target = "imgURL", source = "imgURL")
    @Mapping(target = "discountPercentage", defaultExpression = "java(java.math.BigDecimal.ZERO)")
    @Mapping(target = "displayOrder", defaultExpression = "java(0)")
    @Mapping(target = "isPopular", defaultExpression = "java(false)")
    @Mapping(target = "active", source = "isActive")
    @Mapping(target = "deleted", ignore = true)
    void updateComboFromRequest(ServiceComboUpsertRequest request, @MappingTarget ServiceCombo entity);
}

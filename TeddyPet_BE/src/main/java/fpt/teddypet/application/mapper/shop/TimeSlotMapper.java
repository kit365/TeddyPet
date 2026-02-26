package fpt.teddypet.application.mapper.shop;

import fpt.teddypet.application.dto.request.shop.TimeSlotUpsertRequest;
import fpt.teddypet.application.dto.response.shop.TimeSlotResponse;
import fpt.teddypet.domain.entity.Service;
import fpt.teddypet.domain.entity.TimeSlot;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TimeSlotMapper {

    @Mapping(target = "serviceId", source = "service.id")
    TimeSlotResponse toResponse(TimeSlot entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "service", ignore = true)
    @Mapping(target = "currentBookings", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    void updateFromRequest(TimeSlotUpsertRequest request, @MappingTarget TimeSlot entity);
}

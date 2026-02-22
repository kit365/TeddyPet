package fpt.teddypet.application.mapper.shop;

import fpt.teddypet.application.dto.request.shop.TimeSlotExceptionUpsertRequest;
import fpt.teddypet.application.dto.response.shop.TimeSlotExceptionResponse;
import fpt.teddypet.domain.entity.TimeSlotException;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TimeSlotExceptionMapper {

    @Mapping(target = "isActive", source = "active")
    TimeSlotExceptionResponse toResponse(TimeSlotException entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    void updateFromRequest(TimeSlotExceptionUpsertRequest request, @MappingTarget TimeSlotException entity);
}

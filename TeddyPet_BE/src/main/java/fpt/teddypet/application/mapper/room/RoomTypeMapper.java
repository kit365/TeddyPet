package fpt.teddypet.application.mapper.room;

import fpt.teddypet.application.dto.request.room.RoomTypeUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomTypeResponse;
import fpt.teddypet.domain.entity.RoomType;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RoomTypeMapper {

    @Mapping(target = "roomTypeId", source = "id")
    @Mapping(target = "serviceId", ignore = true)
    @Mapping(target = "serviceName", ignore = true)
    @Mapping(target = "linkedServiceIds", ignore = true)
    @Mapping(target = "linkedServiceNames", ignore = true)
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "isDeleted", source = "deleted")
    RoomTypeResponse toResponse(RoomType entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "rooms", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "active", source = "isActive")
    void updateRoomTypeFromRequest(RoomTypeUpsertRequest request, @MappingTarget RoomType entity);
}

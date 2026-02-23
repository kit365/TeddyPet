package fpt.teddypet.application.mapper.room;

import fpt.teddypet.application.dto.request.room.RoomUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomResponse;
import fpt.teddypet.domain.entity.Room;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RoomMapper {

    @Mapping(target = "roomId", source = "id")
    @Mapping(target = "roomTypeId", source = "roomType.id")
    @Mapping(target = "roomTypeName", source = "roomType.typeName")
    @Mapping(target = "isAvailableForBooking", source = "isAvailableForBooking")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "isDeleted", source = "deleted")
    RoomResponse toResponse(Room entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "roomType", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "status", defaultExpression = "java(fpt.teddypet.domain.enums.RoomStatusEnum.AVAILABLE)")
    @Mapping(target = "isAvailableForBooking", defaultExpression = "java(true)")
    void updateRoomFromRequest(RoomUpsertRequest request, @MappingTarget Room entity);
}

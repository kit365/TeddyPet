package fpt.teddypet.application.port.input.room;

import fpt.teddypet.application.dto.request.room.RoomTypeUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomTypeResponse;

import java.util.List;

public interface RoomTypeService {

    RoomTypeResponse upsert(RoomTypeUpsertRequest request);

    RoomTypeResponse getById(Long id);

    List<RoomTypeResponse> getAll(Long serviceId);

    /** Set or clear the service linked to this room type. serviceId null to unlink. */
    void updateServiceId(Long roomTypeId, Long serviceId);
    
    void delete(Long id);
}

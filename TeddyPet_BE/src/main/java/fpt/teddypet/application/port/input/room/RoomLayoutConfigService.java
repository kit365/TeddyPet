package fpt.teddypet.application.port.input.room;

import fpt.teddypet.application.dto.request.room.RoomLayoutConfigUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomLayoutConfigResponse;

import java.util.List;

public interface RoomLayoutConfigService {

    List<RoomLayoutConfigResponse> getAll();

    RoomLayoutConfigResponse getById(Long id);

    RoomLayoutConfigResponse create(RoomLayoutConfigUpsertRequest request);

    RoomLayoutConfigResponse update(RoomLayoutConfigUpsertRequest request);

    RoomLayoutConfigResponse updateStatus(Long id, String status);

    void delete(Long id);
}

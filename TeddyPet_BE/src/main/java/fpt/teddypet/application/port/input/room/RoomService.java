package fpt.teddypet.application.port.input.room;

import fpt.teddypet.application.dto.request.room.RoomSetPositionRequest;
import fpt.teddypet.application.dto.request.room.RoomUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomResponse;

import java.util.List;

public interface RoomService {

    RoomResponse upsert(RoomUpsertRequest request);

    RoomResponse getById(Long id);

    List<RoomResponse> getAll(Long roomTypeId);

    List<RoomResponse> getAll(Long roomTypeId, Long roomLayoutConfigId);

    void delete(Long id);

    RoomResponse setRoomPosition(Long roomId, RoomSetPositionRequest request);
}

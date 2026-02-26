package fpt.teddypet.application.port.input.room;

import fpt.teddypet.application.dto.request.room.RoomBlockingCreateRequest;
import fpt.teddypet.application.dto.response.room.RoomBlockingResponse;

public interface RoomBlockingService {

    RoomBlockingResponse create(RoomBlockingCreateRequest request);
}

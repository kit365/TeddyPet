package fpt.teddypet.application.service.room;

import fpt.teddypet.application.constants.room.RoomMessages;
import fpt.teddypet.application.dto.request.room.RoomSetPositionRequest;
import fpt.teddypet.application.dto.request.room.RoomUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomResponse;
import fpt.teddypet.application.mapper.room.RoomMapper;
import fpt.teddypet.application.port.input.room.RoomService;
import fpt.teddypet.application.port.output.room.RoomLayoutConfigRepositoryPort;
import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.application.port.output.room.RoomTypeRepositoryPort;
import fpt.teddypet.domain.entity.Room;
import fpt.teddypet.domain.entity.RoomLayoutConfig;
import fpt.teddypet.domain.entity.RoomType;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomApplicationService implements RoomService {

    private final RoomRepositoryPort roomRepositoryPort;
    private final RoomTypeRepositoryPort roomTypeRepositoryPort;
    private final RoomLayoutConfigRepositoryPort roomLayoutConfigRepositoryPort;
    private final RoomMapper roomMapper;

    @Override
    @Transactional
    public RoomResponse upsert(RoomUpsertRequest request) {
        RoomType roomType = roomTypeRepositoryPort.findById(request.roomTypeId())
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("Không tìm thấy loại phòng với ID: %s", request.roomTypeId())));

        Room entity;
        boolean isNew = request.roomId() == null;

        if (isNew) {
            entity = Room.builder().build();
            entity.setDeleted(false);
        } else {
            entity = roomRepositoryPort.findById(request.roomId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            String.format(RoomMessages.MESSAGE_ROOM_NOT_FOUND_BY_ID, request.roomId())));
        }

        roomMapper.updateRoomFromRequest(request, entity);
        entity.setRoomType(roomType);

        // roomNumber, block, tier are not settable via API; they are set by other logic

        if (request.isActive() != null) {
            entity.setActive(request.isActive());
        }
        // BLOCKED status is only set when creating a Room_Blockings record; user cannot
        // set it directly
        if (request.status() != null && request.status() != fpt.teddypet.domain.enums.RoomStatusEnum.BLOCKED) {
            entity.setStatus(request.status());
        }

        Room saved = roomRepositoryPort.save(entity);
        return roomMapper.toResponse(saved);
    }

    @Override
    public RoomResponse getById(Long id) {
        return roomMapper.toResponse(getEntityById(id));
    }

    @Override
    public List<RoomResponse> getAll(Long roomTypeId) {
        List<Room> list = roomTypeId != null
                ? roomRepositoryPort.findByRoomTypeId(roomTypeId)
                : roomRepositoryPort.findAllActive();
        return list.stream().map(roomMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Room entity = getEntityById(id);
        entity.setDeleted(true);
        entity.setActive(false);
        roomRepositoryPort.save(entity);
    }

    @Override
    @Transactional
    public RoomResponse setRoomPosition(Long roomId, RoomSetPositionRequest request) {
        Room room = getEntityById(roomId);
        RoomLayoutConfig layout = roomLayoutConfigRepositoryPort.findById(request.roomLayoutConfigId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy cấu hình layout với ID: " + request.roomLayoutConfigId()));

        String roomNumber = request.roomNumber().trim();
        String tier = request.tier().trim();

        if (roomRepositoryPort.existsByRoomNumberAndIdNot(roomNumber, roomId)) {
            throw new IllegalStateException(RoomMessages.MESSAGE_ROOM_NUMBER_DUPLICATE);
        }
        if (roomRepositoryPort.existsByRoomLayoutConfigIdAndGridRowAndGridColAndTierAndIdNot(
                layout.getId(), request.gridRow(), request.gridCol(), tier, roomId)) {
            throw new IllegalStateException(String.format(RoomMessages.MESSAGE_ROOM_POSITION_OCCUPIED,
                    layout.getBlock(), request.gridRow(), request.gridCol(), tier));
        }

        room.setRoomNumber(roomNumber);
        room.setTier(tier);
        room.setGridRow(request.gridRow());
        room.setGridCol(request.gridCol());
        room.setRoomLayoutConfig(layout);
        room.setBlock(layout.getBlock());
        room.setIsSorted(true);
        Room saved = roomRepositoryPort.save(room);
        return roomMapper.toResponse(saved);
    }

    private Room getEntityById(Long id) {
        return roomRepositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(RoomMessages.MESSAGE_ROOM_NOT_FOUND_BY_ID, id)));
    }
}

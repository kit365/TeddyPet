package fpt.teddypet.application.service.room;

import fpt.teddypet.application.constants.room.RoomMessages;
import fpt.teddypet.application.dto.request.room.RoomUpsertRequest;
import fpt.teddypet.application.dto.response.room.RoomResponse;
import fpt.teddypet.application.mapper.room.RoomMapper;
import fpt.teddypet.application.port.input.room.RoomService;
import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.application.port.output.room.RoomTypeRepositoryPort;
import fpt.teddypet.application.util.ValidationUtils;
import fpt.teddypet.domain.entity.Room;
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

        String roomNumber = (request.roomNumber() != null ? request.roomNumber() : "").trim();
        ValidationUtils.ensureUnique(
                () -> isNew
                        ? roomRepositoryPort.existsByRoomNumberAndRoomTypeId(roomNumber, request.roomTypeId())
                        : roomRepositoryPort.existsByRoomNumberAndRoomTypeIdAndIdNot(roomNumber, request.roomTypeId(), entity.getId()),
                String.format(RoomMessages.MESSAGE_ROOM_NUMBER_ALREADY_EXISTS, roomNumber)
        );
        entity.setRoomNumber(roomNumber);

        if (request.isActive() != null) {
            entity.setActive(request.isActive());
        }
        if (request.isAvailableForBooking() != null) {
            entity.setIsAvailableForBooking(request.isAvailableForBooking());
        }
        if (request.status() != null) {
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

    private Room getEntityById(Long id) {
        return roomRepositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(RoomMessages.MESSAGE_ROOM_NOT_FOUND_BY_ID, id)));
    }
}

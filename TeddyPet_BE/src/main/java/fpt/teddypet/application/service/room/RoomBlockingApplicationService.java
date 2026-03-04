package fpt.teddypet.application.service.room;

import fpt.teddypet.application.constants.room.RoomMessages;
import fpt.teddypet.application.dto.request.room.RoomBlockingCreateRequest;
import fpt.teddypet.application.dto.response.room.RoomBlockingResponse;
import fpt.teddypet.application.port.input.room.RoomBlockingService;
import fpt.teddypet.application.port.output.room.RoomBlockingRepositoryPort;
import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.domain.entity.Room;
import fpt.teddypet.domain.entity.RoomBlocking;
import fpt.teddypet.domain.enums.RoomStatusEnum;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoomBlockingApplicationService implements RoomBlockingService {

    private final RoomBlockingRepositoryPort roomBlockingRepositoryPort;
    private final RoomRepositoryPort roomRepositoryPort;

    @Override
    @Transactional
    public RoomBlockingResponse create(RoomBlockingCreateRequest request) {
        Room room = roomRepositoryPort.findById(request.roomId())
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(RoomMessages.MESSAGE_ROOM_NOT_FOUND_BY_ID, request.roomId())));

        RoomBlocking blocking = RoomBlocking.builder()
                .room(room)
                .blockReason(request.blockReason() != null ? request.blockReason().trim() : null)
                .blockedFrom(request.blockedFrom())
                .blockedTo(request.blockedTo())
                .blockedBy(request.blockedBy() != null ? request.blockedBy().trim() : null)
                .isDeleted(false)
                .isActive(true)
                .build();

        RoomBlocking saved = roomBlockingRepositoryPort.save(blocking);

        // Chỉ set status = BLOCKED khi tạo bản ghi Room_Blockings thành công; user không được set trực tiếp
        room.setStatus(RoomStatusEnum.BLOCKED);
        roomRepositoryPort.save(room);

        return toResponse(saved);
    }

    private static RoomBlockingResponse toResponse(RoomBlocking b) {
        String roomNumber = b.getRoom() != null ? b.getRoom().getRoomNumber() : null;
        return new RoomBlockingResponse(
                b.getId(),
                b.getRoom() != null ? b.getRoom().getId() : null,
                roomNumber,
                b.getBlockReason(),
                b.getBlockedFrom(),
                b.getBlockedTo(),
                b.getBlockedBy(),
                b.getCreatedAt(),
                b.getCreatedBy()
        );
    }
}

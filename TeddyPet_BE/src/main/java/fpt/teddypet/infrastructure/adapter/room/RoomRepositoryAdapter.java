package fpt.teddypet.infrastructure.adapter.room;

import fpt.teddypet.application.port.output.room.RoomRepositoryPort;
import fpt.teddypet.domain.entity.Room;
import fpt.teddypet.infrastructure.persistence.postgres.repository.room.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RoomRepositoryAdapter implements RoomRepositoryPort {

    private final RoomRepository roomRepository;

    @Override
    public Room save(Room room) {
        return roomRepository.save(room);
    }

    @Override
    public Optional<Room> findById(Long id) {
        return roomRepository.findByIdAndIsDeletedFalse(id);
    }

    @Override
    public List<Room> findAllActive() {
        return roomRepository.findByIsActiveTrueAndIsDeletedFalse();
    }

    @Override
    public List<Room> findByRoomTypeId(Long roomTypeId) {
        return roomRepository.findByRoomTypeIdAndIsActiveTrueAndIsDeletedFalse(roomTypeId);
    }

    @Override
    public List<Room> findByRoomLayoutConfigId(Long roomLayoutConfigId) {
        if (roomLayoutConfigId == null) {
            return List.of();
        }
        return roomRepository.findByRoomLayoutConfig_IdAndIsActiveTrueAndIsDeletedFalseOrderByGridRowAscGridColAsc(roomLayoutConfigId);
    }

    @Override
    public boolean existsByRoomNumberAndRoomTypeId(String roomNumber, Long roomTypeId) {
        return roomRepository.existsByRoomNumberAndRoomType_Id(roomNumber, roomTypeId);
    }

    @Override
    public boolean existsByRoomNumberAndRoomTypeIdAndIdNot(String roomNumber, Long roomTypeId, Long id) {
        return roomRepository.existsByRoomNumberAndRoomType_IdAndIdNot(roomNumber, roomTypeId, id);
    }

    @Override
    public boolean existsByRoomNumber(String roomNumber) {
        return roomNumber != null && roomRepository.existsByRoomNumber(roomNumber);
    }

    @Override
    public boolean existsByRoomNumberAndIdNot(String roomNumber, Long id) {
        return roomNumber != null && roomRepository.existsByRoomNumberAndIdNot(roomNumber, id);
    }

    @Override
    public boolean existsByRoomLayoutConfigIdAndGridRowAndGridColAndTier(Long layoutId, Integer gridRow, Integer gridCol, String tier) {
        return layoutId != null && gridRow != null && gridCol != null && tier != null
                && roomRepository.existsByRoomLayoutConfig_IdAndGridRowAndGridColAndTier(layoutId, gridRow, gridCol, tier);
    }

    @Override
    public boolean existsByRoomLayoutConfigIdAndGridRowAndGridColAndTierAndIdNot(Long layoutId, Integer gridRow, Integer gridCol, String tier, Long id) {
        return layoutId != null && gridRow != null && gridCol != null && tier != null && id != null
                && roomRepository.existsByRoomLayoutConfig_IdAndGridRowAndGridColAndTierAndIdNot(layoutId, gridRow, gridCol, tier, id);
    }
}

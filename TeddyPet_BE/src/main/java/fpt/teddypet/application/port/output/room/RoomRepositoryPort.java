package fpt.teddypet.application.port.output.room;

import fpt.teddypet.domain.entity.Room;

import java.util.List;
import java.util.Optional;

public interface RoomRepositoryPort {

    Room save(Room room);

    Optional<Room> findById(Long id);

    List<Room> findAllActive();

    List<Room> findByRoomTypeId(Long roomTypeId);

    List<Room> findByRoomLayoutConfigId(Long roomLayoutConfigId);

    boolean existsByRoomNumberAndRoomTypeId(String roomNumber, Long roomTypeId);

    boolean existsByRoomNumberAndRoomTypeIdAndIdNot(String roomNumber, Long roomTypeId, Long id);

    boolean existsByRoomNumber(String roomNumber);

    boolean existsByRoomNumberAndIdNot(String roomNumber, Long id);

    boolean existsByRoomLayoutConfigIdAndGridRowAndGridColAndTier(Long layoutId, Integer gridRow, Integer gridCol, String tier);

    boolean existsByRoomLayoutConfigIdAndGridRowAndGridColAndTierAndIdNot(Long layoutId, Integer gridRow, Integer gridCol, String tier, Long id);
}

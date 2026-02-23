package fpt.teddypet.application.port.output.room;

import fpt.teddypet.domain.entity.Room;

import java.util.List;
import java.util.Optional;

public interface RoomRepositoryPort {

    Room save(Room room);

    Optional<Room> findById(Long id);

    List<Room> findAllActive();

    List<Room> findByRoomTypeId(Long roomTypeId);

    boolean existsByRoomNumberAndRoomTypeId(String roomNumber, Long roomTypeId);

    boolean existsByRoomNumberAndRoomTypeIdAndIdNot(String roomNumber, Long roomTypeId, Long id);
}

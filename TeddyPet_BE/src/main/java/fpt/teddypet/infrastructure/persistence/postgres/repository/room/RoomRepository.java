package fpt.teddypet.infrastructure.persistence.postgres.repository.room;

import fpt.teddypet.domain.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByIdAndIsDeletedFalse(Long id);

    List<Room> findByIsActiveTrueAndIsDeletedFalse();

    List<Room> findByRoomTypeIdAndIsActiveTrueAndIsDeletedFalse(Long roomTypeId);

    boolean existsByRoomNumberAndRoomType_Id(String roomNumber, Long roomTypeId);

    boolean existsByRoomNumberAndRoomType_IdAndIdNot(String roomNumber, Long roomTypeId, Long id);
}

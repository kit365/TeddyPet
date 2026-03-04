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

    boolean existsByRoomNumber(String roomNumber);

    boolean existsByRoomNumberAndIdNot(String roomNumber, Long id);

    boolean existsByRoomLayoutConfig_IdAndGridRowAndGridColAndTier(Long roomLayoutConfigId, Integer gridRow, Integer gridCol, String tier);

    boolean existsByRoomLayoutConfig_IdAndGridRowAndGridColAndTierAndIdNot(Long roomLayoutConfigId, Integer gridRow, Integer gridCol, String tier, Long id);
}

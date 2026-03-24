package fpt.teddypet.infrastructure.persistence.postgres.repository.room;

import fpt.teddypet.domain.entity.ServiceRoomType;
import fpt.teddypet.domain.entity.ServiceRoomTypeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRoomTypeRepository extends JpaRepository<ServiceRoomType, ServiceRoomTypeId> {

    List<ServiceRoomType> findById_ServiceId(Long serviceId);

    @Query("SELECT srt.id.roomTypeId FROM ServiceRoomType srt WHERE srt.id.serviceId = :serviceId")
    List<Long> findRoomTypeIdsByServiceId(@Param("serviceId") Long serviceId);

    @Query("SELECT srt.id.serviceId FROM ServiceRoomType srt WHERE srt.id.roomTypeId = :roomTypeId")
    List<Long> findServiceIdsByRoomTypeId(@Param("roomTypeId") Long roomTypeId);

    @Query("SELECT CASE WHEN COUNT(srt) > 0 THEN true ELSE false END FROM ServiceRoomType srt WHERE srt.id.serviceId = :serviceId AND srt.id.roomTypeId = :roomTypeId")
    boolean existsByServiceIdAndRoomTypeId(@Param("serviceId") Long serviceId, @Param("roomTypeId") Long roomTypeId);

    @Modifying
    @Query("DELETE FROM ServiceRoomType srt WHERE srt.id.serviceId = :serviceId")
    void deleteByServiceId(@Param("serviceId") Long serviceId);

    @Modifying
    @Query("DELETE FROM ServiceRoomType srt WHERE srt.id.roomTypeId = :roomTypeId")
    void deleteByRoomTypeId(@Param("roomTypeId") Long roomTypeId);
}

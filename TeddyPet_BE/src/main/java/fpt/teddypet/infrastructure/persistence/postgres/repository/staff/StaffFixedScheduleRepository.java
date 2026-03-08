package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.StaffFixedSchedule;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StaffFixedScheduleRepository extends org.springframework.data.jpa.repository.JpaRepository<StaffFixedSchedule, Long> {

    List<StaffFixedSchedule> findByPosition_IdAndDayOfWeekAndIsAfternoon(Long positionId, Integer dayOfWeek, Boolean isAfternoon);

    List<StaffFixedSchedule> findByStaff_Id(Long staffId);

    @Query("SELECT COUNT(s) > 0 FROM StaffFixedSchedule s WHERE s.staff.id = :staffId AND s.position.id = :positionId AND s.dayOfWeek = :dayOfWeek AND s.isAfternoon = :isAfternoon")
    boolean existsByStaff_IdAndPosition_IdAndDayOfWeekAndIsAfternoon(
            @Param("staffId") Long staffId,
            @Param("positionId") Long positionId,
            @Param("dayOfWeek") Integer dayOfWeek,
            @Param("isAfternoon") Boolean isAfternoon);
}

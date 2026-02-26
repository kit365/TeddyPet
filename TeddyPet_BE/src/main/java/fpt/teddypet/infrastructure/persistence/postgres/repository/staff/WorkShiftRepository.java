package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.WorkShift;
import fpt.teddypet.domain.enums.staff.ShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface WorkShiftRepository extends JpaRepository<WorkShift, Long> {

    @Query("SELECT ws FROM WorkShift ws WHERE ws.status = :status AND ws.isDeleted = false AND ws.isActive = true")
    List<WorkShift> findByStatus(@Param("status") ShiftStatus status);

    @Query("SELECT ws FROM WorkShift ws WHERE ws.status = :status " +
            "AND ws.startTime >= :from AND ws.startTime <= :to AND ws.isDeleted = false AND ws.isActive = true")
    List<WorkShift> findByStatusAndStartTimeBetween(
            @Param("status") ShiftStatus status,
            @Param("from") LocalDateTime start,
            @Param("to") LocalDateTime end
    );

    /** Ca của nhân viên trong khoảng thời gian (staff không null) */
    @Query("SELECT ws FROM WorkShift ws WHERE ws.staff.id = :staffId " +
            "AND ws.startTime >= :from AND ws.startTime <= :to AND ws.isDeleted = false AND ws.isActive = true")
    List<WorkShift> findByStaff_IdAndStartTimeBetween(
            @Param("staffId") Long staffId,
            @Param("from") LocalDateTime start,
            @Param("to") LocalDateTime end
    );
}

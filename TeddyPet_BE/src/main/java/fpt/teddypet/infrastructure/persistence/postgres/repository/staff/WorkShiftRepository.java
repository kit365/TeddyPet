package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.WorkShift;
import fpt.teddypet.domain.enums.staff.ShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface WorkShiftRepository extends JpaRepository<WorkShift, Long> {

    @Query("SELECT ws FROM WorkShift ws WHERE ws.status = :status AND ws.isDeleted = false AND ws.isActive = true ORDER BY ws.startTime ASC")
    List<WorkShift> findByStatus(@Param("status") ShiftStatus status);

    @Query("SELECT ws FROM WorkShift ws WHERE ws.status = :status " +
            "AND ws.startTime >= :from AND ws.startTime <= :to AND ws.isDeleted = false AND ws.isActive = true ORDER BY ws.startTime ASC")
    List<WorkShift> findByStatusAndStartTimeBetween(
            @Param("status") ShiftStatus status,
            @Param("from") LocalDateTime start,
            @Param("to") LocalDateTime end
    );

    /** Admin: Lấy tất cả ca trong khoảng (OPEN + ASSIGNED, bỏ CANCELLED) để hiển thị grid kể cả ca đã khóa */
    @Query("SELECT ws FROM WorkShift ws WHERE ws.startTime >= :from AND ws.startTime <= :to " +
            "AND ws.isDeleted = false AND ws.isActive = true AND ws.status <> 'CANCELLED' ORDER BY ws.startTime ASC")
    List<WorkShift> findByStartTimeBetween(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    /**
     * Tìm ca trùng khoảng thời gian: (startTime < endParam AND endTime > startParam).
     * excludeId = null thì không loại trừ; khác null thì bỏ qua ca có id đó (dùng khi cập nhật).
     */
    @Query("SELECT ws FROM WorkShift ws WHERE ws.isDeleted = false AND ws.isActive = true " +
            "AND ws.status <> 'CANCELLED' AND ws.startTime < :endTime AND ws.endTime > :startTime " +
            "AND (:excludeId IS NULL OR ws.id <> :excludeId)")
    List<WorkShift> findOverlapping(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeId") Long excludeId
    );

    /** Ca của nhân viên trong khoảng thời gian (staff không null) */
    @Query("SELECT ws FROM WorkShift ws WHERE ws.staff.id = :staffId " +
            "AND ws.startTime >= :from AND ws.startTime <= :to AND ws.isDeleted = false AND ws.isActive = true ORDER BY ws.startTime ASC")
    List<WorkShift> findByStaff_IdAndStartTimeBetween(
            @Param("staffId") Long staffId,
            @Param("from") LocalDateTime start,
            @Param("to") LocalDateTime end
    );
}

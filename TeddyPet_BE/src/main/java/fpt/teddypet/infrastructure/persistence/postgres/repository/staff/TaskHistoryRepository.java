package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.TaskHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskHistoryRepository extends JpaRepository<TaskHistory, Long> {

    List<TaskHistory> findByStaff_IdAndFinishedAtBetween(Long staffId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT t.staff.id, COUNT(t) FROM TaskHistory t WHERE t.finishedAt IS NOT NULL GROUP BY t.staff.id")
    List<Object[]> countCompletedByStaffId();
}


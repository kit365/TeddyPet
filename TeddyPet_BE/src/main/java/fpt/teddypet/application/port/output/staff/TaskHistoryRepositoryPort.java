package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.TaskHistory;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskHistoryRepositoryPort {

    TaskHistory save(TaskHistory taskHistory);

    List<TaskHistory> findByStaffIdAndFinishedAtBetween(Long staffId, LocalDateTime from, LocalDateTime to);
}


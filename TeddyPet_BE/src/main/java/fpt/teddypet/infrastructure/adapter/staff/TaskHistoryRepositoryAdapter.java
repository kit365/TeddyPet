package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.TaskHistoryRepositoryPort;
import fpt.teddypet.domain.entity.staff.TaskHistory;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.TaskHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TaskHistoryRepositoryAdapter implements TaskHistoryRepositoryPort {

    private final TaskHistoryRepository taskHistoryRepository;

    @Override
    public TaskHistory save(TaskHistory taskHistory) {
        return taskHistoryRepository.save(taskHistory);
    }

    @Override
    public List<TaskHistory> findByStaffIdAndFinishedAtBetween(Long staffId, LocalDateTime from, LocalDateTime to) {
        return taskHistoryRepository.findByStaff_IdAndFinishedAtBetween(staffId, from, to);
    }
}


package fpt.teddypet.application.service.staff;

import fpt.teddypet.application.dto.request.staff.TaskHistoryRequest;
import fpt.teddypet.application.dto.response.staff.TaskHistoryResponse;
import fpt.teddypet.application.port.input.staff.TaskHistoryService;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.application.port.output.staff.TaskHistoryRepositoryPort;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.entity.staff.TaskHistory;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskHistoryApplicationService implements TaskHistoryService {

    private final TaskHistoryRepositoryPort taskHistoryRepositoryPort;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;

    @Override
    @Transactional
    public TaskHistoryResponse create(TaskHistoryRequest request) {
        StaffProfile staff = staffProfileRepositoryPort.findById(request.staffId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy nhân viên với id: " + request.staffId()));

        TaskHistory task = TaskHistory.builder()
                .staff(staff)
                .bookingItemId(request.bookingItemId())
                .startedAt(request.startedAt())
                .finishedAt(request.finishedAt())
                .earnedCommission(request.earnedCommission())
                .build();

        TaskHistory saved = taskHistoryRepositoryPort.save(task);
        return toResponse(saved);
    }

    @Override
    public List<TaskHistoryResponse> getByStaffAndDateRange(Long staffId, LocalDate from, LocalDate to) {
        if (from == null) {
            from = LocalDate.now().minusMonths(1);
        }
        if (to == null) {
            to = LocalDate.now().plusMonths(1);
        }
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);

        return taskHistoryRepositoryPort.findByStaffIdAndFinishedAtBetween(staffId, fromDateTime, toDateTime)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private TaskHistoryResponse toResponse(TaskHistory task) {
        return new TaskHistoryResponse(
                task.getId(),
                task.getStaff().getId(),
                task.getBookingItemId(),
                task.getStartedAt(),
                task.getFinishedAt(),
                task.getEarnedCommission()
        );
    }
}


package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.WorkShiftRepositoryPort;
import fpt.teddypet.domain.entity.staff.WorkShift;
import fpt.teddypet.domain.enums.staff.ShiftStatus;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.WorkShiftRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class WorkShiftRepositoryAdapter implements WorkShiftRepositoryPort {

    private final WorkShiftRepository workShiftRepository;

    @Override
    public WorkShift save(WorkShift workShift) {
        return workShiftRepository.save(workShift);
    }

    @Override
    public Optional<WorkShift> findById(Long id) {
        return workShiftRepository.findById(id);
    }

    @Override
    public List<WorkShift> findOverlapping(LocalDateTime startTime, LocalDateTime endTime, Long excludeShiftId) {
        return workShiftRepository.findOverlapping(startTime, endTime, excludeShiftId);
    }

    @Override
    public List<WorkShift> findByStatus(ShiftStatus status) {
        return workShiftRepository.findByStatus(status);
    }

    @Override
    public List<WorkShift> findByStatusAndStartTimeBetween(
            ShiftStatus status,
            LocalDateTime from,
            LocalDateTime to
    ) {
        return workShiftRepository.findByStatusAndStartTimeBetween(status, from, to);
    }

    @Override
    public List<WorkShift> findByStaffIdAndStartTimeBetween(
            Long staffId,
            LocalDateTime from,
            LocalDateTime to
    ) {
        return workShiftRepository.findByStaff_IdAndStartTimeBetween(staffId, from, to);
    }
}

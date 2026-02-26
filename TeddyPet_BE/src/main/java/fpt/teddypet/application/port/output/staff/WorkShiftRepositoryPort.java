package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.WorkShift;
import fpt.teddypet.domain.enums.staff.ShiftStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WorkShiftRepositoryPort {

    WorkShift save(WorkShift workShift);

    Optional<WorkShift> findById(Long id);

    List<WorkShift> findByStatus(ShiftStatus status);

    List<WorkShift> findByStatusAndStartTimeBetween(
            ShiftStatus status,
            LocalDateTime from,
            LocalDateTime to
    );

    List<WorkShift> findByStaffIdAndStartTimeBetween(
            Long staffId,
            LocalDateTime from,
            LocalDateTime to
    );
}

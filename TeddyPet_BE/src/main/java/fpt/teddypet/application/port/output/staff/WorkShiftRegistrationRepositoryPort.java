package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.WorkShiftRegistration;

import java.util.List;
import java.util.Optional;

public interface WorkShiftRegistrationRepositoryPort {

    WorkShiftRegistration save(WorkShiftRegistration registration);

    Optional<WorkShiftRegistration> findById(Long id);

    List<WorkShiftRegistration> findByWorkShiftIdOrderByRegisteredAtAsc(Long workShiftId);

    boolean existsByWorkShiftIdAndStaffId(Long workShiftId, Long staffId);

    Optional<WorkShiftRegistration> findByIdAndWorkShiftId(Long registrationId, Long workShiftId);
}

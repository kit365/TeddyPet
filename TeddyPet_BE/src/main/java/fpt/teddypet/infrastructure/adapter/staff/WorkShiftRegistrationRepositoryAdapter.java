package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.WorkShiftRegistrationRepositoryPort;
import fpt.teddypet.domain.entity.staff.WorkShiftRegistration;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.WorkShiftRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class WorkShiftRegistrationRepositoryAdapter implements WorkShiftRegistrationRepositoryPort {

    private final WorkShiftRegistrationRepository workShiftRegistrationRepository;

    @Override
    public WorkShiftRegistration save(WorkShiftRegistration registration) {
        return workShiftRegistrationRepository.save(registration);
    }

    @Override
    public Optional<WorkShiftRegistration> findById(Long id) {
        return workShiftRegistrationRepository.findById(id);
    }

    @Override
    public List<WorkShiftRegistration> findByWorkShiftIdOrderByRegisteredAtAsc(Long workShiftId) {
        return workShiftRegistrationRepository.findByWorkShift_IdOrderByRegisteredAtAsc(workShiftId);
    }

    @Override
    public boolean existsByWorkShiftIdAndStaffId(Long workShiftId, Long staffId) {
        return workShiftRegistrationRepository.existsByWorkShift_IdAndStaff_Id(workShiftId, staffId);
    }

    @Override
    public Optional<WorkShiftRegistration> findByIdAndWorkShiftId(Long registrationId, Long workShiftId) {
        return workShiftRegistrationRepository.findByIdAndWorkShift_Id(registrationId, workShiftId);
    }
}

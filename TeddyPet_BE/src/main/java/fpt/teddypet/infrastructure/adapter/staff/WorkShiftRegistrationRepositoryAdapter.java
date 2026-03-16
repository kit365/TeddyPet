package fpt.teddypet.infrastructure.adapter.staff;

import fpt.teddypet.application.port.output.staff.WorkShiftRegistrationRepositoryPort;
import fpt.teddypet.domain.entity.staff.WorkShiftRegistration;
import fpt.teddypet.domain.enums.staff.RegistrationStatus;
import fpt.teddypet.infrastructure.persistence.postgres.repository.staff.WorkShiftRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
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
    public boolean hasActiveRegistrationForShift(Long workShiftId, Long staffId) {
        return workShiftRegistrationRepository.existsByWorkShift_IdAndStaff_IdAndStatusIn(
                workShiftId, staffId,
                List.of(RegistrationStatus.PENDING, RegistrationStatus.APPROVED,
                        RegistrationStatus.PENDING_LEAVE, RegistrationStatus.ON_LEAVE));
    }

    @Override
    public Optional<WorkShiftRegistration> findByIdAndWorkShiftId(Long registrationId, Long workShiftId) {
        return workShiftRegistrationRepository.findByIdAndWorkShift_Id(registrationId, workShiftId);
    }

    @Override
    public Optional<WorkShiftRegistration> findByWorkShiftIdAndStaffId(Long workShiftId, Long staffId) {
        return workShiftRegistrationRepository.findByWorkShift_IdAndStaff_Id(workShiftId, staffId);
    }

    @Override
    public List<WorkShiftRegistration> findByStaffIdAndStatus(Long staffId, RegistrationStatus status) {
        return workShiftRegistrationRepository.findByStaff_IdAndStatusOrderByRegisteredAtDesc(staffId, status);
    }

    @Override
    public List<WorkShiftRegistration> findByStaffIdAndStatusIn(Long staffId, List<RegistrationStatus> statuses) {
        return workShiftRegistrationRepository.findByStaff_IdAndStatusInOrderByRegisteredAtDesc(staffId, statuses);
    }

    @Override
    public long countApprovedByWorkShiftIdAndPositionId(Long workShiftId, Long positionId) {
        return workShiftRegistrationRepository.countByWorkShift_IdAndRoleAtRegistration_IdAndStatus(
                workShiftId, positionId, RegistrationStatus.APPROVED);
    }

    @Override
    public long countApprovedByWorkShiftIdAndRoleNull(Long workShiftId) {
        return workShiftRegistrationRepository.countByWorkShift_IdAndRoleAtRegistrationIsNullAndStatus(
                workShiftId, RegistrationStatus.APPROVED);
    }

    @Override
    public long countByWorkShiftIdAndPositionIdAndStatusIn(Long workShiftId, Long positionId, List<RegistrationStatus> statuses) {
        return workShiftRegistrationRepository.countByWorkShift_IdAndRoleAtRegistration_IdAndStatusIn(
                workShiftId, positionId, statuses);
    }

    @Override
    public long countByWorkShiftIdAndRoleNullAndStatusIn(Long workShiftId, List<RegistrationStatus> statuses) {
        return workShiftRegistrationRepository.countByWorkShift_IdAndRoleAtRegistrationIsNullAndStatusIn(
                workShiftId, statuses);
    }

    @Override
    public long countParticipatingByWorkShiftIdAndPositionId(Long workShiftId, Long positionId) {
        return workShiftRegistrationRepository.countParticipatingByWorkShift_IdAndRoleAtRegistration_Id(workShiftId, positionId);
    }

    @Override
    public long countParticipatingByWorkShiftIdAndPositionIdExcludingRegistrationId(Long workShiftId, Long positionId, Long excludeRegistrationId) {
        return workShiftRegistrationRepository.countParticipatingByWorkShift_IdAndRoleAtRegistration_IdAndIdNot(workShiftId, positionId, excludeRegistrationId);
    }

    @Override
    public long countParticipatingByWorkShiftIdAndRoleNull(Long workShiftId) {
        return workShiftRegistrationRepository.countParticipatingByWorkShift_IdAndRoleAtRegistrationIsNull(workShiftId);
    }

    @Override
    public long countParticipatingByWorkShiftIdAndRoleNullExcludingRegistrationId(Long workShiftId, Long excludeRegistrationId) {
        return workShiftRegistrationRepository.countParticipatingByWorkShift_IdAndRoleAtRegistrationIsNullAndIdNot(workShiftId, excludeRegistrationId);
    }

    @Override
    public List<WorkShiftRegistration> findApprovedByStaffIdAndShiftStartTimeBetween(
            Long staffId, LocalDateTime from, LocalDateTime to) {
        return workShiftRegistrationRepository.findByStaff_IdAndStatusAndWorkShift_StartTimeBetweenOrderByWorkShift_StartTimeAsc(
                staffId, RegistrationStatus.APPROVED, from, to);
    }

    @Override
    public List<WorkShiftRegistration> findByStaffIdAndStatusInAndShiftStartTimeBetween(
            Long staffId, List<RegistrationStatus> statuses, LocalDateTime from, LocalDateTime to) {
        return workShiftRegistrationRepository.findByStaff_IdAndStatusInAndWorkShift_StartTimeBetweenOrderByWorkShift_StartTimeAsc(
                staffId, statuses, from, to);
    }

    @Override
    public void deleteById(Long registrationId) {
        workShiftRegistrationRepository.deleteById(registrationId);
    }

    @Override
    public void deleteAll() {
        workShiftRegistrationRepository.deleteAll();
    }
}

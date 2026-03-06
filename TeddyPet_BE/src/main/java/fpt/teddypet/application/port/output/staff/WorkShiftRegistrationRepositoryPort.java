package fpt.teddypet.application.port.output.staff;

import fpt.teddypet.domain.entity.staff.WorkShiftRegistration;
import fpt.teddypet.domain.enums.staff.RegistrationStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WorkShiftRegistrationRepositoryPort {

    WorkShiftRegistration save(WorkShiftRegistration registration);

    Optional<WorkShiftRegistration> findById(Long id);

    List<WorkShiftRegistration> findByWorkShiftIdOrderByRegisteredAtAsc(Long workShiftId);

    boolean existsByWorkShiftIdAndStaffId(Long workShiftId, Long staffId);

    Optional<WorkShiftRegistration> findByIdAndWorkShiftId(Long registrationId, Long workShiftId);

    Optional<WorkShiftRegistration> findByWorkShiftIdAndStaffId(Long workShiftId, Long staffId);

    List<WorkShiftRegistration> findByStaffIdAndStatus(Long staffId, RegistrationStatus status);

    List<WorkShiftRegistration> findByStaffIdAndStatusIn(Long staffId, List<RegistrationStatus> statuses);

    long countApprovedByWorkShiftIdAndPositionId(Long workShiftId, Long positionId);

    long countApprovedByWorkShiftIdAndRoleNull(Long workShiftId);

    long countByWorkShiftIdAndPositionIdAndStatusIn(Long workShiftId, Long positionId, List<RegistrationStatus> statuses);

    long countByWorkShiftIdAndRoleNullAndStatusIn(Long workShiftId, List<RegistrationStatus> statuses);

    /** Đếm số người đang giữ slot/sẽ đi làm (không tính đã duyệt nghỉ). Dùng cho slot còn trống part-time. */
    long countParticipatingByWorkShiftIdAndPositionId(Long workShiftId, Long positionId);

    /** Như trên nhưng loại trừ một registrationId (dùng khi duyệt đăng ký: không đếm chính đăng ký đang được duyệt). */
    long countParticipatingByWorkShiftIdAndPositionIdExcludingRegistrationId(Long workShiftId, Long positionId, Long excludeRegistrationId);

    long countParticipatingByWorkShiftIdAndRoleNull(Long workShiftId);

    /** Như trên nhưng loại trừ một registrationId. */
    long countParticipatingByWorkShiftIdAndRoleNullExcludingRegistrationId(Long workShiftId, Long excludeRegistrationId);

    List<WorkShiftRegistration> findApprovedByStaffIdAndShiftStartTimeBetween(
            Long staffId, LocalDateTime from, LocalDateTime to);

    List<WorkShiftRegistration> findByStaffIdAndStatusInAndShiftStartTimeBetween(
            Long staffId, List<RegistrationStatus> statuses, LocalDateTime from, LocalDateTime to);

    void deleteById(Long registrationId);

    void deleteAll();
}

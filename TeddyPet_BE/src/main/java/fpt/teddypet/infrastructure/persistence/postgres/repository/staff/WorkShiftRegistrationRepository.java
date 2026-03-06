package fpt.teddypet.infrastructure.persistence.postgres.repository.staff;

import fpt.teddypet.domain.entity.staff.WorkShiftRegistration;
import fpt.teddypet.domain.enums.staff.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WorkShiftRegistrationRepository extends JpaRepository<WorkShiftRegistration, Long> {

    List<WorkShiftRegistration> findByWorkShift_IdOrderByRegisteredAtAsc(Long workShiftId);

    boolean existsByWorkShift_IdAndStaff_Id(Long workShiftId, Long staffId);

    Optional<WorkShiftRegistration> findByIdAndWorkShift_Id(Long registrationId, Long workShiftId);

    Optional<WorkShiftRegistration> findByWorkShift_IdAndStaff_Id(Long workShiftId, Long staffId);

    List<WorkShiftRegistration> findByStaff_IdAndStatusOrderByRegisteredAtDesc(Long staffId, RegistrationStatus status);

    List<WorkShiftRegistration> findByStaff_IdAndStatusInOrderByRegisteredAtDesc(Long staffId, List<RegistrationStatus> statuses);

    /** Đếm số đăng ký theo ca, vai trò (position) và trạng thái – dùng cho ràng buộc max_slots */
    long countByWorkShift_IdAndRoleAtRegistration_IdAndStatus(Long workShiftId, Long positionId, RegistrationStatus status);

    /** Đếm số đăng ký (PENDING + APPROVED) theo ca và vai trò – dùng khi staff đăng ký */
    long countByWorkShift_IdAndRoleAtRegistration_IdAndStatusIn(Long workShiftId, Long positionId, List<RegistrationStatus> statuses);

    /** Đếm số đăng ký theo ca khi không có vai trò (position_id null) – mặc định 1 slot */
    long countByWorkShift_IdAndRoleAtRegistrationIsNullAndStatusIn(Long workShiftId, List<RegistrationStatus> statuses);

    long countByWorkShift_IdAndRoleAtRegistrationIsNullAndStatus(Long workShiftId, RegistrationStatus status);

    /** Lấy đăng ký đã duyệt của nhân viên trong khoảng thời gian ca – dùng cho "Ca của tôi" */
    List<WorkShiftRegistration> findByStaff_IdAndStatusAndWorkShift_StartTimeBetweenOrderByWorkShift_StartTimeAsc(
            Long staffId, RegistrationStatus status, java.time.LocalDateTime from, java.time.LocalDateTime to);

    List<WorkShiftRegistration> findByStaff_IdAndStatusInAndWorkShift_StartTimeBetweenOrderByWorkShift_StartTimeAsc(
            Long staffId, List<RegistrationStatus> statuses, java.time.LocalDateTime from, java.time.LocalDateTime to);

    /**
     * Đếm số người đang "giữ slot" / sẽ đi làm: APPROVED, PENDING, hoặc PENDING_LEAVE chưa được duyệt nghỉ.
     * Không tính ON_LEAVE và không tính PENDING_LEAVE đã có leave_decision = APPROVED_LEAVE (admin đã duyệt nghỉ).
     * Dùng cho: hiển thị slot còn trống cho part-time và kiểm tra khi part-time đăng ký.
     */
    @Query("SELECT COUNT(r) FROM WorkShiftRegistration r WHERE r.workShift.id = :workShiftId AND r.roleAtRegistration.id = :positionId AND (" +
            "(r.status = 'APPROVED' OR r.status = 'PENDING') OR (r.status = 'PENDING_LEAVE' AND (r.leaveDecision IS NULL OR r.leaveDecision <> 'APPROVED_LEAVE')))")
    long countParticipatingByWorkShift_IdAndRoleAtRegistration_Id(@Param("workShiftId") Long workShiftId, @Param("positionId") Long positionId);

    @Query("SELECT COUNT(r) FROM WorkShiftRegistration r WHERE r.workShift.id = :workShiftId AND r.roleAtRegistration IS NULL AND (" +
            "(r.status = 'APPROVED' OR r.status = 'PENDING') OR (r.status = 'PENDING_LEAVE' AND (r.leaveDecision IS NULL OR r.leaveDecision <> 'APPROVED_LEAVE')))")
    long countParticipatingByWorkShift_IdAndRoleAtRegistrationIsNull(@Param("workShiftId") Long workShiftId);

    /** Như countParticipating... nhưng loại trừ một đăng ký (dùng khi duyệt: không đếm chính đăng ký đang duyệt). */
    @Query("SELECT COUNT(r) FROM WorkShiftRegistration r WHERE r.workShift.id = :workShiftId AND r.roleAtRegistration.id = :positionId AND r.id <> :excludeRegistrationId AND (" +
            "(r.status = 'APPROVED' OR r.status = 'PENDING') OR (r.status = 'PENDING_LEAVE' AND (r.leaveDecision IS NULL OR r.leaveDecision <> 'APPROVED_LEAVE')))")
    long countParticipatingByWorkShift_IdAndRoleAtRegistration_IdAndIdNot(
            @Param("workShiftId") Long workShiftId, @Param("positionId") Long positionId, @Param("excludeRegistrationId") Long excludeRegistrationId);

    @Query("SELECT COUNT(r) FROM WorkShiftRegistration r WHERE r.workShift.id = :workShiftId AND r.roleAtRegistration IS NULL AND r.id <> :excludeRegistrationId AND (" +
            "(r.status = 'APPROVED' OR r.status = 'PENDING') OR (r.status = 'PENDING_LEAVE' AND (r.leaveDecision IS NULL OR r.leaveDecision <> 'APPROVED_LEAVE')))")
    long countParticipatingByWorkShift_IdAndRoleAtRegistrationIsNullAndIdNot(
            @Param("workShiftId") Long workShiftId, @Param("excludeRegistrationId") Long excludeRegistrationId);
}

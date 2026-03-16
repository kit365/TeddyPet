package fpt.teddypet.domain.entity.staff;

import fpt.teddypet.domain.entity.BaseEntity;
import fpt.teddypet.domain.enums.staff.EmploymentTypeEnum;
import fpt.teddypet.domain.enums.staff.RegistrationStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * Đăng ký ca làm việc của nhân viên.
 * Một ca có thể có nhiều đăng ký được duyệt (theo định mức từng role trong ShiftRoleConfig).
 */
@Entity
@Table(
        name = "work_shift_registrations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_registration_shift_staff",
                columnNames = {"work_shift_id", "staff_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class WorkShiftRegistration extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registration_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_shift_id", nullable = false)
    private WorkShift workShift;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private StaffProfile staff;

    /** Vai trò (chức vụ) của nhân viên tại thời điểm đăng ký – dùng để áp dụng max_slots theo role */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id", nullable = true)
    private StaffPosition roleAtRegistration;

    /** Full-time / Part-time tại thời điểm đăng ký – dùng để ưu tiên hiển thị/duyệt */
    @Enumerated(EnumType.STRING)
    @Column(name = "work_type", length = 20)
    private EmploymentTypeEnum workType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RegistrationStatus status;

    @Column(name = "registered_at", nullable = false)
    private LocalDateTime registeredAt;

    /**
     * Lý do xin nghỉ do nhân viên nhập (tùy chọn).
     */
    @Column(name = "leave_reason")
    private String leaveReason;

    /**
     * Quyết định admin cho xin nghỉ (PENDING_LEAVE): APPROVED_LEAVE = sẽ nghỉ, REJECTED_LEAVE = từ chối.
     * Chỉ được áp dụng khi admin bấm "Duyệt lần cuối (khóa ca)".
     */
    @Column(name = "leave_decision", length = 20)
    private String leaveDecision;
}

package fpt.teddypet.domain.entity.staff;

import fpt.teddypet.domain.entity.BaseEntity;
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
 * Nhân viên đăng ký vào ca trống (OPEN), admin duyệt 1 trong số các đăng ký.
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

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RegistrationStatus status;

    /** Thời điểm nhân viên đăng ký (có thể dùng createdAt từ BaseEntity) */
    @Column(name = "registered_at", nullable = false)
    private LocalDateTime registeredAt;
}

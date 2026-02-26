package fpt.teddypet.domain.entity.staff;

import fpt.teddypet.domain.entity.BaseEntity;
import fpt.teddypet.domain.enums.staff.ShiftStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * Ca làm việc theo luồng Open Shifts + Shift Bidding.
 * - status = OPEN: ca trống, nhân viên có thể đăng ký
 * - status = ASSIGNED: đã duyệt và gán nhân viên
 * - staff nullable: null khi OPEN, set khi ASSIGNED/COMPLETED
 */
@Entity
@Table(name = "work_shifts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class WorkShift extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shift_id")
    private Long id;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ShiftStatus status;

    /** Nhân viên được gán (null khi status = OPEN) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = true)
    private StaffProfile staff;

    /**
     * Thời gian check-in thực tế (optional, dùng cho payroll khi có).
     * Nếu null, Payroll có thể dùng startTime/endTime.
     */
    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    /**
     * Thời gian check-out thực tế (optional, dùng cho payroll khi có).
     */
    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;
}

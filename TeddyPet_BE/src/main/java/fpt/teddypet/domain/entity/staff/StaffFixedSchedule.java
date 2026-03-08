package fpt.teddypet.domain.entity.staff;

import fpt.teddypet.domain.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Lịch cố định của nhân viên Full-time: ca nào (thứ + sáng/chiều) + vai trò.
 * Dùng để auto-fill Registration APPROVED khi ca được khởi tạo.
 */
@Entity
@Table(
        name = "staff_fixed_schedules",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_staff_fixed_schedule_staff_position_day_slot",
                columnNames = {"staff_id", "position_id", "day_of_week", "is_afternoon"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class StaffFixedSchedule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private StaffProfile staff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id", nullable = false)
    private StaffPosition position;

    /** 1 = Thứ 2, 7 = Chủ nhật (Java DayOfWeek.getValue()) */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @Column(name = "is_afternoon", nullable = false)
    private Boolean isAfternoon;
}

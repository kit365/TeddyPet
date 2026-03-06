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
 * Định mức số lượng theo vai trò (chức vụ) cho từng ca.
 * Một ca có thể có nhiều config: ví dụ Thu ngân 1, Chăm sóc 2, Spa 1.
 */
@Entity
@Table(
        name = "shift_role_configs",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_shift_role_config_shift_position",
                columnNames = {"work_shift_id", "position_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class ShiftRoleConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "config_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_shift_id", nullable = false)
    private WorkShift workShift;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_id", nullable = false)
    private StaffPosition position;

    @Column(name = "max_slots", nullable = false)
    private Integer maxSlots = 1;
}

package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "no_show_config")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class NoShowConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Thời gian chờ khách sau giờ hẹn (phút). Nếu quá sẽ coi là NO-SHOW. */
    @Column(name = "grace_period_minutes", nullable = false)
    private Integer gracePeriodMinutes;

    /** Tự động đánh dấu NO-SHOW sau khi quá grace_period. */
    @Column(name = "auto_mark_no_show", nullable = false)
    private Boolean autoMarkNoShow;

    /** Có tịch thu cọc khi NO-SHOW không. */
    @Column(name = "forfeit_deposit", nullable = false)
    private Boolean forfeitDeposit;

    /** Mức phạt bổ sung (VND) khi NO-SHOW, ngoài tiền cọc bị giữ (nếu có). */
    @Column(name = "penalty_amount", nullable = false, precision = 12, scale = 2)
    private java.math.BigDecimal penaltyAmount;

    /** Cho phép check-in muộn sau giờ hẹn nhưng vẫn coi là đến. */
    @Column(name = "allow_late_checkin", nullable = false)
    private Boolean allowLateCheckin;

    /** Số phút cho phép check-in muộn (chỉ áp dụng khi allow_late_checkin = true). */
    @Column(name = "late_checkin_minutes", nullable = false)
    private Integer lateCheckinMinutes;
}


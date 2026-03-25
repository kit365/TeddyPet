package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

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

    /** Tên hiển thị trong danh sách quản trị. */
    @Column(nullable = false, length = 255)
    private String name;

    /** Dịch vụ áp dụng cấu hình No-Show này (mỗi dịch vụ chỉ thuộc tối đa một cấu hình — FK trên {@link Service#noShowConfig}). */
    @OneToMany(mappedBy = "noShowConfig", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Service> linkedServices = new ArrayList<>();

    /** Thời gian chờ khách sau giờ hẹn (phút). Nếu quá sẽ coi là NO-SHOW. */
    @Column(name = "grace_period_minutes", nullable = false)
    private Integer gracePeriodMinutes;

    /** Tự động đánh dấu NO-SHOW sau khi quá grace_period. */
    @Column(name = "auto_mark_no_show", nullable = false)
    private Boolean autoMarkNoShow;

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


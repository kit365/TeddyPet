package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "booking_deposit_refund_policies")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BookingDepositRefundPolicy extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_name", length = 100, nullable = false)
    private String policyName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "deposit_percentage", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal depositPercentage = BigDecimal.valueOf(25.00);

    @Column(name = "full_refund_hours", nullable = false)
    @Builder.Default
    private Integer fullRefundHours = 48;

    @Column(name = "full_refund_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal fullRefundPercentage = BigDecimal.valueOf(100.00);

    @Column(name = "partial_refund_hours", nullable = false)
    @Builder.Default
    private Integer partialRefundHours = 24;

    @Column(name = "partial_refund_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal partialRefundPercentage = BigDecimal.valueOf(50.00);

    @Column(name = "no_refund_hours", nullable = false)
    @Builder.Default
    private Integer noRefundHours = 12;

    @Column(name = "no_refund_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal noRefundPercentage = BigDecimal.ZERO;

    @Column(name = "no_show_refund_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal noShowRefundPercentage = BigDecimal.ZERO;

    @Column(name = "no_show_penalty", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal noShowPenalty = BigDecimal.ZERO;

    @Column(name = "allow_force_majeure")
    @Builder.Default
    private Boolean allowForceMajeure = true;

    @Column(name = "force_majeure_refund_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal forceMajeureRefundPercentage = BigDecimal.valueOf(100.00);

    @Column(name = "force_majeure_requires_evidence")
    @Builder.Default
    private Boolean forceMajeureRequiresEvidence = true;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "highlight_text", length = 255)
    private String highlightText;
}


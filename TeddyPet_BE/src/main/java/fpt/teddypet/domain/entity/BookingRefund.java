package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_refunds")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BookingRefund extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Booking booking;

    @Column(name = "bank_information_id")
    private Long bankInformationId;

    @Column(name = "requested_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal requestedAmount;

    @Column(name = "currency", length = 10, nullable = false)
    @Builder.Default
    private String currency = "VND";

    @Column(name = "customer_reason", columnDefinition = "TEXT", nullable = false)
    private String customerReason;

    @Column(name = "evidence_urls", columnDefinition = "TEXT")
    private String evidenceUrls;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, REFUNDED

    @Column(name = "admin_decision_note", columnDefinition = "TEXT")
    private String adminDecisionNote;

    @Column(name = "processed_by", length = 255)
    private String processedBy;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "refund_transaction_id", length = 100)
    private String refundTransactionId;

    @Column(name = "refund_method", length = 50)
    private String refundMethod;

    @Column(name = "refund_completed_at")
    private LocalDateTime refundCompletedAt;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "booking_refund_admin_evidence", joinColumns = @JoinColumn(name = "refund_id"))
    @Column(name = "evidence_url", columnDefinition = "TEXT")
    private java.util.List<String> adminEvidenceUrls = new java.util.ArrayList<>();
}

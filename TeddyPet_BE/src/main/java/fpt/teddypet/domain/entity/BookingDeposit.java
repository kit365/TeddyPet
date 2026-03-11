package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_deposits")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BookingDeposit extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "booking_code", length = 50)
    private String bookingCode;

    @Column(name = "deposit_amount", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(name = "deposit_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal depositPercentage = BigDecimal.valueOf(25.00);

    @Column(name = "deposit_paid")
    @Builder.Default
    private Boolean depositPaid = false;

    @Column(name = "deposit_paid_at")
    private LocalDateTime depositPaidAt;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "refunded")
    @Builder.Default
    private Boolean refunded = false;

    @Column(name = "refund_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal refundAmount = BigDecimal.ZERO;

    @Column(name = "refund_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal refundPercentage = BigDecimal.ZERO;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "refund_method", length = 50)
    private String refundMethod;

    @Column(name = "webhook_payload", columnDefinition = "TEXT")
    private String webhookPayload;

    @Column(name = "refund_reason", columnDefinition = "TEXT")
    private String refundReason;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "reminder_sent", nullable = false)
    @Builder.Default
    private Boolean reminderSent = false;

    @Column(name = "reminder_sent_at")
    private LocalDateTime reminderSentAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "confirmed_by", length = 50)
    private String confirmedBy;

    @Column(name = "refund_processed_by", length = 50)
    private String refundProcessedBy;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "hold_payload", nullable = false)
    private String holdPayloadJson;
}

package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Một lần thanh toán hóa đơn (phần còn lại), không phải thanh toán cọc.
 * Một booking có thể có nhiều giao dịch (tiền mặt + chuyển khoản).
 */
@Entity
@Table(name = "booking_payment_transactions")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BookingPaymentTransaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "transaction_type", nullable = false, length = 50)
    private String transactionType; // FINAL_PAYMENT

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod; // CASH, BANK_TRANSFER, VIETQR

    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    @Column(name = "paid_by")
    private UUID paidBy;

    @Column(name = "paid_by_name", length = 100)
    private String paidByName;

    @Column(name = "paid_at", nullable = false)
    private LocalDateTime paidAt;

    @Column(name = "received_by")
    private UUID receivedBy;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, COMPLETED, FAILED, CANCELLED

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}

package fpt.teddypet.domain.entity;

import fpt.teddypet.application.constants.payments.PaymentConstants;
import fpt.teddypet.domain.enums.payments.PaymentMethodEnum;
import fpt.teddypet.domain.enums.payments.PaymentStatusEnum;
import fpt.teddypet.domain.enums.payments.PaymentTypeEnum;
import fpt.teddypet.domain.exception.PaymentDomainException;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Order order;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 50)
    private PaymentMethodEnum paymentMethod;

    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private PaymentStatusEnum status;

    /**
     * Loại giao dịch: thanh toán đơn hàng hay hoàn tiền.
     * Dùng để phân biệt lịch sử thu tiền và hoàn tiền cho cùng một đơn.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false, length = 50)
    private PaymentTypeEnum paymentType;

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(name = "payment_gateway", length = 50)
    private String paymentGateway;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "failed_at")
    private Instant failedAt;

    /** Mã trả về từ cổng (PayOS: 00=thành công, 07=đã hủy, ...) */
    @Column(name = "gateway_response_code", length = 20)
    private String gatewayResponseCode;

    /** JSON payload webhook đã verify, lưu để đối soát và debug */
    @Column(name = "gateway_raw_payload", columnDefinition = "TEXT")
    private String gatewayRawPayload;

    /** URL checkout từ cổng (PayOS). Dùng để trả về khi PayOS báo "đơn thanh toán đã tồn tại". */
    @Column(name = "checkout_url", length = 512)
    private String checkoutUrl;

    public boolean isAlreadyCompleted() {
        return this.status == PaymentStatusEnum.COMPLETED;
    }

    public boolean canComplete() {
        return this.status == PaymentStatusEnum.PENDING;
    }

    public void complete(String gatewayDisplayName) {
        if (!canComplete()) {
            throw new PaymentDomainException(
                    "Cannot complete payment in status: " + this.status
            );
        }
        this.status = PaymentStatusEnum.COMPLETED;
        this.notes = PaymentConstants.Messages.MSG_PAYMENT_COMPLETED + gatewayDisplayName;
        this.completedAt = Instant.now();
    }

    public void fail(String reason) {
        this.status = PaymentStatusEnum.FAILED;
        this.notes = PaymentConstants.Messages.MSG_PAYMENT_FAILED_PREFIX + reason;
        this.failedAt = Instant.now();
    }
}


package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.PaymentMethodEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "payments")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 50)
    private PaymentMethodEnum paymentMethod;

    @Column(name = "status", nullable = false, length = 50)
    private String status; // PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(name = "payment_gateway", length = 50)
    private String paymentGateway; // VNPAY, MOMO, ZALOPAY, etc.

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}


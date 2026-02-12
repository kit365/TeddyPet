package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.entity.promotions.Promotion;
import fpt.teddypet.domain.enums.promotions.DiscountTypeEnum;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.orders.OrderTypeEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Entity
@Table(name = "orders")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Order extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "order_code", nullable = false, unique = true, length = 50)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id") // Nullable cho guest checkout
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_address_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private UserAddress userAddress;

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "shipping_fee", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "voucher_code", length = 50)
    private String voucherCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Promotion promotion;

    @Column(name = "final_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal finalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 20)
    @Builder.Default
    private OrderTypeEnum orderType = OrderTypeEnum.ONLINE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatusEnum status;

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(name = "shipping_phone", nullable = false, length = 20)
    private String shippingPhone;

    @Column(name = "shipping_name", nullable = false, length = 100)
    private String shippingName;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "guest_email", length = 255)
    private String guestEmail;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "delivering_at")
    private LocalDateTime deliveringAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelled_by", length = 100)
    private String cancelledBy;

    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> orderItems = new ArrayList<>();

    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    public void addOrderItem(OrderItem item) {
        this.orderItems.add(item);
        item.setOrder(this);
    }

    public void addPayment(Payment payment) {
        this.payments.add(payment);
        payment.setOrder(this);
    }

    public void removePayment(Payment payment) {
        this.payments.remove(payment);
        payment.setOrder(null);
    }

    public void calculateFinalAmount() {
        BigDecimal safeSubTotal = this.subtotal != null ? this.subtotal : BigDecimal.ZERO;
        BigDecimal safeShipping = this.shippingFee != null ? this.shippingFee : BigDecimal.ZERO;
        BigDecimal safeDiscount = this.discountAmount != null ? this.discountAmount : BigDecimal.ZERO;
        this.finalAmount = safeSubTotal.add(safeShipping).subtract(safeDiscount).max(BigDecimal.ZERO);
    }

    @PrePersist
    public void prePersist() {
        if (this.orderCode == null) {
            generateAndSetOrderCode();
        }
    }

    public void generateAndSetOrderCode() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = now.format(DateTimeFormatter.ofPattern("yyMMdd")); // VD: 240131
        String randomPart = generateSafeRandomString(5); // 5 ký tự an toàn
        // Format: ORD-240131-A7K92
        this.orderCode = "ORD-" + datePart + "-" + randomPart;
    }

    private static final String ALLOWED_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Loại bỏ 0, O, 1, I

    private String generateSafeRandomString(int length) {
        StringBuilder sb = new StringBuilder(length);
        ThreadLocalRandom random = ThreadLocalRandom.current();
        for (int i = 0; i < length; i++) {
            sb.append(ALLOWED_CHARS.charAt(random.nextInt(ALLOWED_CHARS.length())));
        }
        return sb.toString();
    }

    public void applyPromotion(Promotion promotion) {
        if (promotion == null) {
            return;
        }

        this.voucherCode = promotion.getCode();
        this.promotion = promotion;

        BigDecimal discount;

        if (promotion.getDiscountType() == DiscountTypeEnum.PERCENTAGE) {
            discount = this.subtotal
                    .multiply(promotion.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            if (promotion.getMaxDiscountAmount() != null &&
                    discount.compareTo(promotion.getMaxDiscountAmount()) > 0) {
                discount = promotion.getMaxDiscountAmount();
            }
        } else {
            discount = promotion.getDiscountValue();
        }

        this.discountAmount = discount.min(this.subtotal);

        calculateFinalAmount();
    }
}

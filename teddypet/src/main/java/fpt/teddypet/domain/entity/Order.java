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
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "shipping_fee", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    // mã voucher được lưu
    @Column(name = "voucher_code", length = 50)
    private String voucherCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Promotion promotion;

    // (finalAmount = subtotal + shippingFee - discountAmount)
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

    public void generateAndSetOrderCode() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String timePart = now.format(DateTimeFormatter.ofPattern("HHmmss"));
        this.orderCode = datePart + "-" + timePart + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
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

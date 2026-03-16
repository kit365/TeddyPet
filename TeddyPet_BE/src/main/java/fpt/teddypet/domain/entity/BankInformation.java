package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "bank_information")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BankInformation extends BaseEntity {

    /** account_type: GUEST = khách vãng lai (không đăng nhập), CUSTOMER = khách đã đăng nhập, SYSTEM = tài khoản nhận tiền PayOS */
    public static final String ACCOUNT_TYPE_GUEST = "GUEST";
    public static final String ACCOUNT_TYPE_CUSTOMER = "CUSTOMER";
    public static final String ACCOUNT_TYPE_SYSTEM = "SYSTEM";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "booking_id")
    private Long bookingId;

    /** Đơn hàng liên quan (vd: lưu thông tin người chuyển từ PayOS theo order) */
    @Column(name = "order_id")
    private UUID orderId;

    /** Email khách (guest) để lần sau dùng cùng email order/booking thì hiển thị lại thông tin chuyển khoản đã lưu */
    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Column(name = "account_number", length = 50, nullable = false)
    private String accountNumber;

    @Column(name = "account_holder_name", length = 255, nullable = false)
    private String accountHolderName;

    @Column(name = "bank_code", length = 50, nullable = false)
    private String bankCode;

    @Column(name = "bank_name", length = 255, nullable = false)
    private String bankName;

    @Column(name = "is_verify", nullable = false)
    @Builder.Default
    private boolean isVerify = false;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    /** CUSTOMER = ngân hàng khách / tk hoàn tiền đặt lịch, SYSTEM = tài khoản nhận tiền thanh toán online (PayOS) */
    @Column(name = "account_type", length = 50, nullable = false)
    @Builder.Default
    private String accountType = "CUSTOMER";

    /** URL ảnh mã QR VietQR (img.vietqr.io) - lưu để lần sau lấy lên dùng, chủ yếu cho SYSTEM */
    @Column(name = "vietqr_image_url", columnDefinition = "TEXT")
    private String vietqrImageUrl;
}


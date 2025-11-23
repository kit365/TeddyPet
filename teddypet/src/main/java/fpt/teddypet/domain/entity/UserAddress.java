package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "user_addresses")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserAddress extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // --- NGƯỜI NHẬN (Receiver Info) ---
    @Column(name = "receiver_name", nullable = false, length = 100)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false, length = 15)
    private String receiverPhone;

    // --- ĐỊA CHỈ HÀNH CHÍNH (Administrative Units) ---
    @Column(name = "province_id")
    private Integer provinceId; // ID Tỉnh/Thành (GHN)

    @Column(name = "province_name", nullable = false, length = 100)
    private String provinceName; // VD: TP. Hồ Chí Minh

    @Column(name = "district_id")
    private Integer districtId; // ID Quận/Huyện (GHN)

    @Column(name = "district_name", nullable = false, length = 100)
    private String districtName; // VD: Quận 1

    @Column(name = "ward_code")
    private String wardCode;    // Mã Phường/Xã (GHN thường dùng String code)

    @Column(name = "ward_name", nullable = false, length = 100)
    private String wardName;     // VD: Phường Bến Nghé

    // --- ĐỊA CHỈ CỤ THỂ ---
    @Column(name = "address_detail", nullable = false, length = 255)
    private String addressDetail; // Số nhà, tên đường (VD: 123 Đường Lê Lợi)

    // --- CẤU HÌNH ---
    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false; // Địa chỉ mặc định

    @Column(name = "type")
    private String type; // Nhãn: "Nhà riêng", "Văn phòng" (Optional)
}

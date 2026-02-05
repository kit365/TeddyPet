package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "shipping_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ShippingRule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "is_inner_city")
    @Builder.Default
    private Boolean isInnerCity = true;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "district_id")
    private Integer districtId;

    @Column(name = "fixed_fee")
    private BigDecimal fixedFee; // Phí hiển thị dự kiến cho khách

    @Column(name = "max_internal_distance_km")
    private Double maxInternalDistanceKm; // Ngưỡng tối đa nhân viên shop tự ship

    @Column(name = "fee_per_km")
    private BigDecimal feePerKm; // Đơn giá gợi ý tính phí cho Admin

    @Column(name = "free_ship_threshold")
    private BigDecimal freeShipThreshold; // Đơn hàng trên mức này thì freeship nội thành

    @Column(name = "note")
    private String note;

    @Column(name = "min_fee")
    private BigDecimal minFee; // Phí tối thiểu

    @Column(name = "base_weight")
    private Double baseWeight; // Trọng lượng cơ bản (kg)

    @Column(name = "over_weight_fee")
    private BigDecimal overWeightFee; // Phí quá khổ mỗi kg

    @Column(name = "free_ship_distance_km")
    private Double freeShipDistanceKm; // Khoảng cách dưới ngưỡng này phí ship = 0

    @Column(name = "is_self_ship")
    @Builder.Default
    private Boolean isSelfShip = true; // Shop tự vận chuyển hay cần Grab/Ahamove
}

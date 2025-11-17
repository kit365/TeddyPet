package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.UnitEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "product_variants")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ProductVariant extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "variant_id")
    private Long variantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 100)
    private String name; // Ví dụ: "Gói 500g", "Gói 1.5kg"

    @Column(name = "weight", nullable = false)
    @Builder.Default
    private Integer weight = 0; 

    @Column(name = "length")
    @Builder.Default
    private Integer length = 0; // Đơn vị: cm

    @Column(name = "width")
    @Builder.Default
    private Integer width = 0; // Đơn vị: cm

    @Column(name = "height")
    @Builder.Default
    private Integer height = 0; // Đơn vị: cm

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "sale_price", precision = 10, scale = 2)
    private BigDecimal salePrice; // Giá khuyến mãi

    @Column(nullable = false, unique = true, length = 50)
    private String sku; // Ví dụ: ABC-500, ABC-1K5, ABC-3K

    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", nullable = false, length = 50)
    private UnitEnum unit;

    // Ảnh đại diện cho variant (chọn từ danh sách ảnh của Product)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "featured_image_id")
    private ProductImage featuredImage;
}


package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class OrderItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Liên kết (có thể nullable để phòng trường hợp sản phẩm bị xóa)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    // Snapshot - Bản sao dữ liệu tại thời điểm mua (QUAN TRỌNG)
    @Column(name = "product_name", nullable = false, length = 200)
    private String productName; // Copy từ Product.name

    @Column(name = "variant_name", length = 100)
    private String variantName; // Copy từ ProductVariant.name

    @Column(name = "sku", length = 50)
    private String sku; // Copy từ ProductVariant.sku

    @Column(name = "image_url", length = 500)
    private String imageUrl; // Copy từ ProductImage (ảnh đại diện)
}


package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.UnitEnum;
import fpt.teddypet.domain.valueobject.Dimensions;
import fpt.teddypet.domain.valueobject.Price;
import fpt.teddypet.domain.valueobject.Sku;
import fpt.teddypet.domain.valueobject.StockQuantity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

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
    private String name;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "weight", column = @Column(name = "weight", nullable = false)),
            @AttributeOverride(name = "length", column = @Column(name = "length")),
            @AttributeOverride(name = "width", column = @Column(name = "width")),
            @AttributeOverride(name = "height", column = @Column(name = "height"))
    })
    @Builder.Default
    private Dimensions dimensions = Dimensions.empty();

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "amount", column = @Column(name = "price", nullable = false, precision = 10, scale = 2)),
            @AttributeOverride(name = "saleAmount", column = @Column(name = "sale_price", precision = 10, scale = 2))
    })
    private Price price;

    @Embedded
    @AttributeOverride(name = "value", column = @Column(name = "sku", nullable = false, unique = true, length = 50))
    private Sku sku;

    @Embedded
    @AttributeOverride(name = "value", column = @Column(name = "stock_quantity", nullable = false))
    @Builder.Default
    private StockQuantity stockQuantity = StockQuantity.of(0);

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private fpt.teddypet.domain.enums.ProductStatusEnum status = fpt.teddypet.domain.enums.ProductStatusEnum.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", nullable = false, length = 50)
    private UnitEnum unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "featured_image_id")
    private ProductImage featuredImage;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "product_variant_attribute_values", joinColumns = @JoinColumn(name = "variant_id"), inverseJoinColumns = @JoinColumn(name = "value_id"))
    @Builder.Default
    private List<ProductAttributeValue> attributeValues = new ArrayList<>();
}

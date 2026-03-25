package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.AttributeDisplayType;
import fpt.teddypet.domain.enums.UnitEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_attributes")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ProductAttribute extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attribute_id")
    private Long attributeId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "display_type", nullable = false, length = 50)
    private AttributeDisplayType displayType;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @ManyToMany(mappedBy = "attributes", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Product> products = new ArrayList<>();

    @OneToMany(mappedBy = "attribute", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductAttributeValue> values = new ArrayList<>();

    // Danh sách các đơn vị được hỗ trợ (Ví dụ: Weight -> [GRAM, KILOGRAM])
    // Nếu là Màu sắc -> List rỗng
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "product_attribute_supported_units",
            joinColumns = @JoinColumn(name = "attribute_id")
    )
    @Column(name = "unit", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private List<UnitEnum> supportedUnits = new ArrayList<>();
}


package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.AttributeDisplayType;
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
    private Integer displayOrder = 0; // Thứ tự hiển thị

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
        name = "product_attribute_options",
        joinColumns = @JoinColumn(name = "attribute_id")
    )
    @Column(name = "option_value", nullable = false, length = 255)
    @Builder.Default
    private List<String> options = new ArrayList<>();

    @ManyToMany(mappedBy = "attributes", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Product> products = new ArrayList<>();

    @OneToMany(mappedBy = "attribute", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductAttributeValue> values = new ArrayList<>();
}


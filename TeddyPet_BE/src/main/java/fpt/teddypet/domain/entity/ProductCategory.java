package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.converter.PetTypeListJsonConverter;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductCategoryTypeEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_categories")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ProductCategory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String slug;

    @Column(length = 500)
    private String description;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(name = "alt_image", length = 255)
    private String altImage;

    /** Loại danh mục: FOOD, ACCESSORY, TOY, HYGIENE, ... */
    @Enumerated(EnumType.STRING)
    @Column(name = "category_type", length = 50)
    private ProductCategoryTypeEnum categoryType;

    /** Loại thú cưng phù hợp (DOG, CAT, OTHER) - lưu JSON array */
    @Column(name = "suitable_pet_types", columnDefinition = "TEXT")
    @Convert(converter = PetTypeListJsonConverter.class)
    private List<PetTypeEnum> suitablePetTypes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private ProductCategory parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductCategory> children = new ArrayList<>();

    @ManyToMany(mappedBy = "categories", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Product> products = new ArrayList<>();

    /**
     * Check if this category is a root category (no parent)
     */
    public boolean isRoot() {
        return parent == null;
    }
}

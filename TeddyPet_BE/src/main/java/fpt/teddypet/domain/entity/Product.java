package fpt.teddypet.domain.entity;

import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Product extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String slug; 

    @Column(name = "barcode", unique = true, length = 50)
    private String barcode; // Mã vạch/mã quét sản phẩm (do nhà sản xuất cung cấp)

    @Column(name = "sku", unique = true, length = 50)
    private String sku; // Mã quản lý kho nội bộ (tự động sinh bởi hệ thống)

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "meta_title", length = 255)
    private String metaTitle; // Tiêu đề hiển thị trên tab trình duyệt và Google

    @Column(name = "meta_description", length = 500)
    private String metaDescription; // Đoạn mô tả ngắn hiển thị trên Google

    @Column(name = "min_price", precision = 10, scale = 2)
    private BigDecimal minPrice;

    @Column(name = "max_price", precision = 10, scale = 2)
    private BigDecimal maxPrice;

    @Column(name = "origin", length = 100)
    private String origin; // Xuất xứ

    @Column(name = "material", length = 100)
    private String material; // Chất liệu

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0; // Số lượt xem (denormalized)

    @Column(name = "sold_count", nullable = false)
    @Builder.Default
    private Integer soldCount = 0; // Số lượng đã bán (denormalized)

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "product_pet_types", joinColumns = @JoinColumn(name = "product_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "pet_type", nullable = false, length = 50)
    @Builder.Default
    private List<PetTypeEnum> petTypes = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private ProductStatusEnum status = ProductStatusEnum.IN_STOCK;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "product_product_categories",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "product_category_id")
    )
    @Builder.Default
    private List<ProductCategory> categories = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "product_product_tags",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "product_tag_id")
    )
    @Builder.Default
    private List<ProductTag> tags = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "product_age_ranges",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "age_range_id")
    )
    @Builder.Default
    private List<ProductAgeRange> ageRanges = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_brand_id")
    private ProductBrand brand;


    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    // Tất cả ảnh của product (Single Source of Truth)
    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Rating> ratings = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "product_product_attributes",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "attribute_id")
    )
    @Builder.Default
    private List<ProductAttribute> attributes = new ArrayList<>();
}


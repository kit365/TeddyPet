package fpt.teddypet.domain.entity.promotions;
import fpt.teddypet.domain.entity.BaseEntity;
import fpt.teddypet.domain.enums.promotions.DiscountTypeEnum;
import fpt.teddypet.domain.enums.promotions.PromotionScopeEnum;
import fpt.teddypet.domain.enums.promotions.PromotionStatusEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "promotions")
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Promotion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "thumbnail", length = 500)
    private String thumbnail;
    
    @Column(name = "alt_image", length = 255)
    private String altImage;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private DiscountTypeEnum discountType;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "max_discount_amount", precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "min_order_amount", precision = 10, scale = 2)
    private BigDecimal minOrderAmount;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "usage_count", nullable = false)
    @Builder.Default
    private Integer usageCount = 0;

    @Column(name = "usage_limit_per_user")
    private Integer usageLimitPerUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 20)
    @Builder.Default
    private PromotionScopeEnum scope = PromotionScopeEnum.ALL;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PromotionStatusEnum status = PromotionStatusEnum.SCHEDULED;

    @Version
    @Column(name = "version")
    private Long version;

    @ElementCollection
    @CollectionTable(name = "promotion_apply_products", joinColumns = @JoinColumn(name = "promotion_id"))
    @Column(name = "product_id")
    @Builder.Default
    private List<Long> applyProducts = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "promotion_apply_categories", joinColumns = @JoinColumn(name = "promotion_id"))
    @Column(name = "category_id")
    @Builder.Default
    private List<Long> applyCategories = new ArrayList<>();

    @OneToMany(mappedBy = "promotion", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private List<PromotionUsage> promotionUsages = new ArrayList<>();

    public void incrementUsageCount() {
        if (this.usageCount == null) {
            this.usageCount = 0;
        }
        this.usageCount++;
    }

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return this.status == PromotionStatusEnum.ACTIVE
                && this.startDate.isBefore(now)
                && this.endDate.isAfter(now)
                && (this.usageLimit == null || this.usageCount < this.usageLimit);
    }

    public boolean canBeUsedBy(Integer userUsageCount) {
        return this.usageLimitPerUser == null || userUsageCount < this.usageLimitPerUser;
    }
}

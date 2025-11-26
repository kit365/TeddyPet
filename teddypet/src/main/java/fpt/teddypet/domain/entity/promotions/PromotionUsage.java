package fpt.teddypet.domain.entity.promotions;

import fpt.teddypet.domain.entity.BaseEntity;
import fpt.teddypet.domain.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "promotion_usages", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "promotion_id"})
})
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class PromotionUsage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Promotion promotion;

    @Column(name = "usage_count", nullable = false)
    @Builder.Default
    private Integer usageCount = 0;

    public void incrementUsageCount() {
        if (this.usageCount == null) {
            this.usageCount = 0;
        }
        this.usageCount++;
    }
}

package fpt.teddypet.application.port.output.promotions;
import fpt.teddypet.domain.entity.promotions.PromotionUsage;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PromotionUsageRepositoryPort {
    PromotionUsage save(PromotionUsage promotionUsage);
    PromotionUsage findById(UUID usageId);
    Optional<PromotionUsage> findByUserIdAndPromotionId(UUID userId, UUID promotionId);
    List<PromotionUsage> findByUserId(UUID userId);
    List<PromotionUsage> findByPromotionId(UUID promotionId);
    Integer countByUserIdAndPromotionId(UUID userId, UUID promotionId);
    PromotionUsage getReferenceById(UUID usageId);
}

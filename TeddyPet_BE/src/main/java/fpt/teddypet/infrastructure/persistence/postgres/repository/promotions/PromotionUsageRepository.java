package fpt.teddypet.infrastructure.persistence.postgres.repository.promotions;
import fpt.teddypet.domain.entity.promotions.PromotionUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, UUID> {
    Optional<PromotionUsage> findByUserIdAndPromotionId(UUID userId, UUID promotionId);
    List<PromotionUsage> findByUserId(UUID userId);
    List<PromotionUsage> findByPromotionId(UUID promotionId);
    
    @Query(value = "SELECT COALESCE(SUM(usage_count), 0) FROM promotion_usages WHERE user_id = :userId AND promotion_id = :promotionId", nativeQuery = true)
    Integer sumUsageCountByUserIdAndPromotionId(@Param("userId") UUID userId, @Param("promotionId") UUID promotionId);
}

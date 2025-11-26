package fpt.teddypet.infrastructure.adapter.promotions;
import fpt.teddypet.application.port.output.promotions.PromotionUsageRepositoryPort;
import fpt.teddypet.domain.entity.promotions.PromotionUsage;
import fpt.teddypet.infrastructure.persistence.postgres.repository.promotions.PromotionUsageRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PromotionUsageRepositoryAdapter implements PromotionUsageRepositoryPort {

    private final PromotionUsageRepository promotionUsageRepository;

    @Override
    public PromotionUsage save(PromotionUsage promotionUsage) {
        return promotionUsageRepository.save(promotionUsage);
    }

    @Override
    public PromotionUsage findById(UUID usageId) {
        return promotionUsageRepository.findById(usageId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("PromotionUsage not found with id: %s", usageId)));
    }

    @Override
    public Optional<PromotionUsage> findByUserIdAndPromotionId(UUID userId, UUID promotionId) {
        return promotionUsageRepository.findByUserIdAndPromotionId(userId, promotionId);
    }

    @Override
    public List<PromotionUsage> findByUserId(UUID userId) {
        return promotionUsageRepository.findByUserId(userId);
    }

    @Override
    public List<PromotionUsage> findByPromotionId(UUID promotionId) {
        return promotionUsageRepository.findByPromotionId(promotionId);
    }

    @Override
    public Integer countByUserIdAndPromotionId(UUID userId, UUID promotionId) {
        Integer count = promotionUsageRepository.sumUsageCountByUserIdAndPromotionId(userId, promotionId);
        return count != null ? count : 0;
    }

    @Override
    public PromotionUsage getReferenceById(UUID usageId) {
        return promotionUsageRepository.getReferenceById(usageId);
    }
}

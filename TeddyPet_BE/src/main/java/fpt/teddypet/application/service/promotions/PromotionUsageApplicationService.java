package fpt.teddypet.application.service.promotions;

import fpt.teddypet.application.constants.promotions.PromotionUsageLogMessages;
import fpt.teddypet.application.dto.response.promotions.promotion_usage.PromotionUsageInfo;
import fpt.teddypet.application.dto.response.promotions.promotion_usage.PromotionUsageResponse;
import fpt.teddypet.application.mapper.promotions.PromotionUsageMapper;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.input.promotions.PromotionUsageService;
import fpt.teddypet.application.port.output.promotions.PromotionUsageRepositoryPort;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.entity.promotions.Promotion;
import fpt.teddypet.domain.entity.promotions.PromotionUsage;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromotionUsageApplicationService implements PromotionUsageService {

    private final PromotionUsageRepositoryPort promotionUsageRepositoryPort;
    private final PromotionUsageMapper promotionUsageMapper;
    private final UserService userService;
    private final PromotionApplicationService promotionApplicationService;

    @Override
    @Transactional
    public PromotionUsageResponse recordUsage(UUID userId, UUID promotionId) {
        log.info(PromotionUsageLogMessages.LOG_PROMOTION_USAGE_RECORD_START, userId, promotionId);

        // Get user and promotion via services
        User user = userService.getById(userId);
        Promotion promotion = promotionApplicationService.getById(promotionId);

        // Check if usage record already exists
        Optional<PromotionUsage> existingUsage = promotionUsageRepositoryPort
                .findByUserIdAndPromotionId(userId, promotionId);

        PromotionUsage promotionUsage;
        if (existingUsage.isPresent()) {
            // Increment existing usage
            promotionUsage = existingUsage.get();
            promotionUsage.incrementUsageCount();
            log.info(PromotionUsageLogMessages.LOG_PROMOTION_USAGE_INCREMENT,
                    userId, promotionId, promotionUsage.getUsageCount());
        } else {
            // Create new usage record
            promotionUsage = PromotionUsage.builder()
                    .user(user)
                    .promotion(promotion)
                    .usageCount(1)
                    .isActive(true)
                    .isDeleted(false)
                    .build();
        }

        // Also increment usage count on promotion entity
        promotion.incrementUsageCount();

        PromotionUsage savedUsage = promotionUsageRepositoryPort.save(promotionUsage);
        log.info(PromotionUsageLogMessages.LOG_PROMOTION_USAGE_RECORD_SUCCESS, savedUsage.getId());
        return promotionUsageMapper.toResponse(savedUsage);
    }

    @Override
    public PromotionUsageResponse getByIdResponse(UUID usageId) {
        log.info(PromotionUsageLogMessages.LOG_PROMOTION_USAGE_GET_BY_ID, usageId);
        PromotionUsage usage = getById(usageId);
        return promotionUsageMapper.toResponse(usage);
    }

    @Override
    public PromotionUsage getById(UUID usageId) {
        return promotionUsageRepositoryPort.findById(usageId);
    }

    @Override
    public PromotionUsage getByUserIdAndPromotionId(UUID userId, UUID promotionId) {
        return promotionUsageRepositoryPort.findByUserIdAndPromotionId(userId, promotionId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("PromotionUsage not found for User ID: %s and Promotion ID: %s",
                                userId, promotionId)));
    }

    @Override
    public List<PromotionUsageResponse> getByUserId(UUID userId) {
        List<PromotionUsage> usages = promotionUsageRepositoryPort.findByUserId(userId);
        log.info(PromotionUsageLogMessages.LOG_PROMOTION_USAGE_GET_BY_USER, userId, usages.size());
        return usages.stream()
                .map(promotionUsageMapper::toResponse)
                .toList();
    }

    @Override
    public List<PromotionUsageResponse> getByPromotionId(UUID promotionId) {
        List<PromotionUsage> usages = promotionUsageRepositoryPort.findByPromotionId(promotionId);
        log.info(PromotionUsageLogMessages.LOG_PROMOTION_USAGE_GET_BY_PROMOTION, promotionId, usages.size());
        return usages.stream()
                .map(promotionUsageMapper::toResponse)
                .toList();
    }

    @Override
    public Integer getUserPromotionUsageCount(UUID userId, UUID promotionId) {
        Integer count = promotionUsageRepositoryPort.countByUserIdAndPromotionId(userId, promotionId);
        log.info(PromotionUsageLogMessages.LOG_PROMOTION_USAGE_CHECK_LIMIT,
                userId, promotionId, count, "N/A");
        return count != null ? count : 0;
    }

    @Override
    public boolean canUserUsePromotion(UUID userId, UUID promotionId) {
        Promotion promotion = promotionApplicationService.getById(promotionId);
        Integer userUsageCount = getUserPromotionUsageCount(userId, promotionId);

        boolean canUse = promotion.canBeUsedBy(userUsageCount);

        log.info(PromotionUsageLogMessages.LOG_PROMOTION_USAGE_CHECK_LIMIT,
                userId, promotionId, userUsageCount, promotion.getUsageLimitPerUser());

        return canUse;
    }

    @Override
    public PromotionUsageInfo toInfo(PromotionUsage promotionUsage) {
        return toInfo(promotionUsage, false, true);
    }

    @Override
    public PromotionUsageInfo toInfo(PromotionUsage promotionUsage, boolean includeDeleted) {
        return toInfo(promotionUsage, includeDeleted, false);
    }

    @Override
    public PromotionUsageInfo toInfo(PromotionUsage promotionUsage, boolean includeDeleted, boolean onlyActive) {
        if (promotionUsage == null) {
            return null;
        }

        if (!includeDeleted && promotionUsage.isDeleted()) {
            return null;
        }

        if (onlyActive && !promotionUsage.isActive()) {
            return null;
        }

        return promotionUsageMapper.toInfo(promotionUsage);
    }
}

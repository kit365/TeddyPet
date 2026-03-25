package fpt.teddypet.application.port.input.promotions;

import fpt.teddypet.application.dto.response.promotions.promotion_usage.PromotionUsageInfo;
import fpt.teddypet.application.dto.response.promotions.promotion_usage.PromotionUsageResponse;
import fpt.teddypet.domain.entity.promotions.PromotionUsage;
import java.util.List;
import java.util.UUID;

public interface PromotionUsageService {
    PromotionUsageResponse recordUsage(UUID userId, UUID promotionId);
    PromotionUsageResponse getByIdResponse(UUID usageId);
    PromotionUsage getById(UUID usageId);
    PromotionUsage getByUserIdAndPromotionId(UUID userId, UUID promotionId);
    List<PromotionUsageResponse> getByUserId(UUID userId);
    List<PromotionUsageResponse> getByPromotionId(UUID promotionId);
    Integer getUserPromotionUsageCount(UUID userId, UUID promotionId);
    boolean canUserUsePromotion(UUID userId, UUID promotionId);
    PromotionUsageInfo toInfo(PromotionUsage promotionUsage);
    PromotionUsageInfo toInfo(PromotionUsage promotionUsage, boolean includeDeleted);
    PromotionUsageInfo toInfo(PromotionUsage promotionUsage, boolean includeDeleted, boolean onlyActive);
}

package fpt.teddypet.application.dto.response.promotions.promotion_usage;

import java.util.UUID;

public record PromotionUsageInfo(
        UUID id,
        UUID userId,
        UUID promotionId,
        Integer usageCount,
        boolean isDeleted,
        boolean isActive
) {
}

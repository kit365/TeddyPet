package fpt.teddypet.application.dto.response.promotions.promotion_usage;

import java.time.LocalDateTime;
import java.util.UUID;

public record PromotionUsageResponse(
        UUID id,
        UUID userId,
        String username,
        UUID promotionId,
        String promotionCode,
        Integer usageCount,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}

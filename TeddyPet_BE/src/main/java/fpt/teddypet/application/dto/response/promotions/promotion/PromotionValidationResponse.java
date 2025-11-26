package fpt.teddypet.application.dto.response.promotions.promotion;

import java.math.BigDecimal;
import java.util.UUID;

public record PromotionValidationResponse(
        boolean valid,
        String message,
        UUID promotionId,
        String promotionCode,
        BigDecimal discountAmount,
        Integer remainingUsageCount,
        Integer userRemainingUsageCount
) {
}

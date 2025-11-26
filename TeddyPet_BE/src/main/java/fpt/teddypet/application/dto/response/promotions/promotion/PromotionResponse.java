package fpt.teddypet.application.dto.response.promotions.promotion;

import fpt.teddypet.domain.enums.promotions.DiscountTypeEnum;
import fpt.teddypet.domain.enums.promotions.PromotionScopeEnum;
import fpt.teddypet.domain.enums.promotions.PromotionStatusEnum;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PromotionResponse(
        UUID id,
        String code,
        String name,
        String thumbnail,
        String altImage,
        DiscountTypeEnum discountType,
        BigDecimal discountValue,
        BigDecimal maxDiscountAmount,
        BigDecimal minOrderAmount,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Integer usageLimit,
        Integer usageCount,
        Integer usageLimitPerUser,
        PromotionScopeEnum scope,
        PromotionStatusEnum status,
        Long version,
        List<Long> applyProducts,
        List<Long> applyCategories,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}

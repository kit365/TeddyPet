package fpt.teddypet.application.dto.response.promotions.promotion;

import fpt.teddypet.domain.enums.promotions.PromotionStatusEnum;

import java.util.UUID;

public record PromotionInfo(
        UUID id,
        String code,
        String name,
        PromotionStatusEnum status,
        boolean isDeleted,
        boolean isActive
) {
}

package fpt.teddypet.application.dto.request.promotions;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PromotionUsageRequest(
        @NotNull(message = "User ID là bắt buộc")
        UUID userId,

        @NotNull(message = "Promotion ID là bắt buộc")
        UUID promotionId
) {
}

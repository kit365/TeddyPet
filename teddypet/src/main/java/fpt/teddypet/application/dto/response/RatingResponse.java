package fpt.teddypet.application.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RatingResponse(
        Long ratingId,
        Long productId,
        String productName,
        Long userId,
        String userName,
        BigDecimal score,
        String comment,
        Boolean isVerifiedPurchase,
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}


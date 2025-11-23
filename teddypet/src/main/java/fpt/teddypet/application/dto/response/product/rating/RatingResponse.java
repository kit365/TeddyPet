package fpt.teddypet.application.dto.response.product.rating;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record RatingResponse(
        Long ratingId,
        Long productId,
        String productName,
        UUID userId,
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


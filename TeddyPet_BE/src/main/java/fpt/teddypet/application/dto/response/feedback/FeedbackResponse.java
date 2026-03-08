package fpt.teddypet.application.dto.response.feedback;

import java.time.LocalDateTime;

public record FeedbackResponse(
                Long id,
                String userName,
                String guestName,
                Long productId,
                String productName,
                String productSlug,
                String productImage,
                Long variantId,
                String variantName,
                Integer rating,
                String comment,
                String replyComment,
                LocalDateTime repliedAt,
                boolean isEdited,
                boolean isPurchased,
                LocalDateTime createdAt,
                LocalDateTime updatedAt) {
}

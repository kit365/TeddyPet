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
                @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime repliedAt,
                String orderCode,
                boolean isEdited,
                boolean isPurchased,
                @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime createdAt,
                @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime updatedAt) {
}

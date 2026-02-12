package fpt.teddypet.application.dto.response.feedback;

public record FeedbackItemResponse(
                Long productId,
                Long variantId,
                String productName,
                String variantName,
                String imageUrl,
                Integer rating,
                String comment,
                boolean isSubmitted) {
}

package fpt.teddypet.application.dto.request.feedback;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record FeedbackRequest(
        UUID token, // For guest
        UUID orderId, // For logged in user
        @NotNull(message = "Product ID is required") Long productId,
        Long variantId,
        @NotNull(message = "Rating is required") @Min(value = 1, message = "Rating must be at least 1") @Max(value = 5, message = "Rating must be at most 5") Integer rating,
        @NotBlank(message = "Comment cannot be empty") String comment) {
}

package fpt.teddypet.application.dto.request.newsletter;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record NewsletterSubscriptionRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email
) {
}

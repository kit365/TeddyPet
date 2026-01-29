package fpt.teddypet.application.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for resending verification email.
 */
public record ResendEmailRequest(
        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email) {
}

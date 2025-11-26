package fpt.teddypet.application.dto.request.auth;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Username or Email is required")
        String usernameOrEmail,
        
        @NotBlank(message = "Password is required")
        String password
) {
}

package fpt.teddypet.application.dto.response;

import java.time.LocalDateTime;

/**
 * Response DTO containing only the authentication token.
 * Used for login and verify-email responses.
 */
public record TokenResponse(
                String token,
                String refreshToken,
                LocalDateTime expiresAt) {
}

package fpt.teddypet.application.dto.response;

import java.time.LocalDateTime;

/**
 * Response DTO for registration containing resend email cooldown info.
 */
public record RegisterResponse(
        String message,
        long resendCooldownSeconds,
        LocalDateTime canResendAt) {
}

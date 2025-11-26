package fpt.teddypet.application.dto.response;

import java.time.LocalDateTime;

public record AuthResponse(
        String token,
        String username,
        String email,
        String firstName,
        String lastName,
        String role,
        LocalDateTime expiresAt
) {
}

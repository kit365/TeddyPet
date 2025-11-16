package fpt.teddypet.application.dto.response;

import java.time.LocalDateTime;

public record AuthResponse(
        String token,
        String email,
        String fullName,
        String roleName,
        LocalDateTime expiresAt
) {
}


package fpt.teddypet.application.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record AuthResponse(
        UUID id,
        String token,
        String username,
        String email,
        String firstName,
        String lastName,
        String role,
        LocalDateTime expiresAt,
        Boolean mustChangePassword
) {
}

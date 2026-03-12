package fpt.teddypet.application.dto.response;

import fpt.teddypet.domain.enums.GenderEnum;
import fpt.teddypet.domain.enums.UserStatusEnum;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO containing user profile information.
 * Used for the /me endpoint to get current authenticated user info.
 */
public record UserProfileResponse(
        UUID id,
        String username,
        String email,
        String firstName,
        String lastName,
        String phoneNumber,
        String avatarUrl,
        String altImage,
        GenderEnum gender,
        LocalDate dateOfBirth,
        LocalDateTime createdAt,
        UserStatusEnum status,
        String role) {
}

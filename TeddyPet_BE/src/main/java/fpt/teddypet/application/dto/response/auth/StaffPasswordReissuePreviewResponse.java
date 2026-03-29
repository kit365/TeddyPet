package fpt.teddypet.application.dto.response.auth;

public record StaffPasswordReissuePreviewResponse(
        String email,
        String username,
        String fullName,
        Long staffId) {
}

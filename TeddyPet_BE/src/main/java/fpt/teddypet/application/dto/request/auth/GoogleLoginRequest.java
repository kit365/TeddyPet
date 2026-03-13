package fpt.teddypet.application.dto.request.auth;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
    @NotBlank(message = "Id Token is required")
    String idToken
) {}

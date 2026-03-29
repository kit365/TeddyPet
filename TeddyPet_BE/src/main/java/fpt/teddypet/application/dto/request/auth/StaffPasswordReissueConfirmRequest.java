package fpt.teddypet.application.dto.request.auth;

import jakarta.validation.constraints.NotBlank;

public record StaffPasswordReissueConfirmRequest(
        @NotBlank(message = "Thiếu mã xác nhận.") String token) {
}

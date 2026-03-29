package fpt.teddypet.application.dto.request.auth;

import jakarta.validation.constraints.NotBlank;

public record StaffPasswordReissueRequest(
        @NotBlank(message = "Vui lòng nhập email hoặc tên đăng nhập.") String usernameOrEmail) {
}

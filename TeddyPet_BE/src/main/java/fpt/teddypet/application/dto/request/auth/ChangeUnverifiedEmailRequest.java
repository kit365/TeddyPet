package fpt.teddypet.application.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ChangeUnverifiedEmailRequest(
        @NotBlank(message = "Email cũ không được để trống") @Email(message = "Email cũ không hợp lệ") String oldEmail,

        @NotBlank(message = "Email mới không được để trống") @Email(message = "Email mới không hợp lệ") String newEmail,

        @NotBlank(message = "Mật khẩu không được để trống") String password) {
}

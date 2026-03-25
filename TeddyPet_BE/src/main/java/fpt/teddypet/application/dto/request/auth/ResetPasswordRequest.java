package fpt.teddypet.application.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
                @NotBlank(message = "Token không được để trống") String token,

                @NotBlank(message = "Mật khẩu mới không được để trống") @Size(min = 5, max = 100, message = "Mật khẩu phải từ 5 đến 100 ký tự") String newPassword,

                @NotBlank(message = "Xác nhận mật khẩu không được để trống") String confirmPassword) {
}

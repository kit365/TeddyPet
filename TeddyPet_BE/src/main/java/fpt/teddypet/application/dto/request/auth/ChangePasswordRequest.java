package fpt.teddypet.application.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
                @NotBlank(message = "Mật khẩu cũ là bắt buộc") String oldPassword,

                @NotBlank(message = "Mật khẩu mới là bắt buộc") @Size(min = 5, message = "Mật khẩu mới phải có ít nhất 5 ký tự") String newPassword,

                @NotBlank(message = "Mã xác thực là bắt buộc") String otpCode) {
}

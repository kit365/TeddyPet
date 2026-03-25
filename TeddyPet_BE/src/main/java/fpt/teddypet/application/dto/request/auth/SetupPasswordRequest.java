package fpt.teddypet.application.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SetupPasswordRequest(
    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 6, message = "Mật khẩu phải từ 6 ký tự trở lên")
    String newPassword,
    
    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    String confirmPassword
) {}

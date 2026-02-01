package fpt.teddypet.application.dto.request.otp;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyOtpRequest(
        @NotBlank(message = "Email không được để trống") @Email(message = "Email không đúng định dạng") String email,

        @NotBlank(message = "Mã OTP không được để trống") @Size(min = 6, max = 6, message = "Mã OTP phải có 6 ký tự") String otpCode) {
}

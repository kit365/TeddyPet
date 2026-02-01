package fpt.teddypet.application.dto.request.otp;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SendOtpRequest(
        @NotBlank(message = "Email không được để trống") @Email(message = "Email không đúng định dạng") String email) {
}

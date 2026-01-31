package fpt.teddypet.presentation.controller.auth;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.otp.SendOtpRequest;
import fpt.teddypet.application.dto.request.otp.VerifyOtpRequest;
import fpt.teddypet.application.port.input.auth.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/send")
    @Operation(summary = "Gửi mã OTP xác thực email (cho khách vãng lai)", description = "Gửi mã OTP 6 số qua email. Mã hết hạn sau 5 phút. Nếu email đã thuộc về thành viên sẽ báo lỗi.")
    public ResponseEntity<ApiResponse<Long>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        long cooldown = otpService.sendGuestOtp(request.email());
        return ResponseEntity.ok(ApiResponse.success("Mã OTP đã được gửi đến email của bạn.", cooldown));
    }

    @PostMapping("/verify")
    @Operation(summary = "Kiểm tra mã OTP (Không xóa OTP)", description = "Dùng để kiểm tra nhanh OTP nhập đúng chưa trước khi submit đơn hàng. OTP vẫn giữ trong hệ thống sau khi gọi API này.")
    public ResponseEntity<ApiResponse<String>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        otpService.validateGuestOtp(request.email(), request.otpCode());
        return ResponseEntity.ok(ApiResponse.success("Mã OTP chính xác."));
    }
}

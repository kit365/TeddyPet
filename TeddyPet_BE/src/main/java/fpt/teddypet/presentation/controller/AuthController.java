package fpt.teddypet.presentation.controller;

import fpt.teddypet.application.constants.auth.AuthMessages;
import fpt.teddypet.application.constants.auth.PasswordResetMessages;
import fpt.teddypet.application.dto.request.auth.ForgotPasswordRequest;
import fpt.teddypet.application.dto.request.auth.GoogleLoginRequest;
import fpt.teddypet.application.dto.request.auth.LoginRequest;
import fpt.teddypet.application.dto.request.auth.RegisterRequest;
import fpt.teddypet.application.dto.request.auth.ResendEmailRequest;
import fpt.teddypet.application.dto.request.auth.ChangeUnverifiedEmailRequest;
import fpt.teddypet.application.dto.request.auth.ResetPasswordRequest;
import fpt.teddypet.application.dto.request.otp.VerifyOtpRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.RegisterResponse;
import fpt.teddypet.application.dto.response.TokenResponse;
import fpt.teddypet.application.dto.response.UserProfileResponse;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.PasswordResetService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiConstants.API_AUTH)
@Tag(name = "Xác thực", description = "API đăng ký, đăng nhập và quản lý xác thực người dùng")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới", description = "Đăng ký tài khoản bằng email và mật khẩu, trả về thông tin xác thực lại email (resend cooldown).")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.registerWithResponse(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response.message(), response));
    }

    @PostMapping("/mobile/register")
    @Operation(summary = "Đăng ký tài khoản cho Mobile", description = "Đăng ký tài khoản bằng email + gửi OTP 6 số để xác thực thay vì link email.")
    public ResponseEntity<ApiResponse<RegisterResponse>> registerMobile(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.registerMobile(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response.message(), response));
    }

    @PostMapping("/mobile/verify-register-otp")
    @Operation(summary = "Xác thực OTP đăng ký cho Mobile", description = "Xác thực mã OTP sau khi đăng ký trên Mobile. Nếu OTP hợp lệ, tài khoản được kích hoạt và trả về token để auto-login.")
    public ResponseEntity<ApiResponse<TokenResponse>> verifyRegisterOtp(@Valid @RequestBody VerifyOtpRequest request) {
        TokenResponse response = authService.verifyRegisterOtp(request.email(), request.otpCode());
        return ResponseEntity.ok(ApiResponse.success(AuthMessages.MESSAGE_VERIFY_EMAIL_SUCCESS, response));
    }

    @PostMapping("/resend-email")
    @Operation(summary = "Gửi lại email xác thực", description = "Gửi lại email xác thực cho người dùng, có giới hạn thời gian chờ 2 phút.")
    public ResponseEntity<ApiResponse<RegisterResponse>> resendVerificationEmail(
            @Valid @RequestBody ResendEmailRequest request) {
        RegisterResponse response = authService.resendVerificationEmail(request);
        return ResponseEntity.ok(ApiResponse.success(response.message(), response));
    }

    @PostMapping("/change-email")
    @Operation(summary = "Đổi email thành viên chưa xác thực", description = "Đổi địa chỉ email cho tài khoản đang ở trạng thái chưa xác thực. Yêu cầu mật khẩu để bảo mật.")
    public ResponseEntity<ApiResponse<RegisterResponse>> changeUnverifiedEmail(
            @Valid @RequestBody ChangeUnverifiedEmailRequest request) {
        RegisterResponse response = authService.changeUnverifiedEmail(request);
        return ResponseEntity.ok(ApiResponse.success(response.message(), response));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập", description = "Đăng nhập bằng email/username và mật khẩu. Trả về access token và refresh token.")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse response = authService.loginForToken(request);
        return ResponseEntity.ok(ApiResponse.success(AuthMessages.MESSAGE_LOGIN_SUCCESS, response));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Làm mới token", description = "Lấy access token mới bằng refresh token.")
    public ResponseEntity<ApiResponse<TokenResponse>> refreshToken(
            @Valid @RequestBody fpt.teddypet.application.dto.request.auth.RefreshTokenRequest request) {
        TokenResponse response = authService.refreshToken(request.refreshToken());
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Xác thực email", description = "Xác thực email bằng token đã gửi trong email sau khi đăng ký.")
    public ResponseEntity<ApiResponse<TokenResponse>> verifyEmail(@RequestParam String token) {
        TokenResponse response = authService.verifyEmailForToken(token);
        return ResponseEntity.ok(ApiResponse.success(AuthMessages.MESSAGE_VERIFY_EMAIL_SUCCESS, response));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin tài khoản hiện tại", description = "Lấy thông tin hồ sơ người dùng đang đăng nhập (yêu cầu JWT hợp lệ).")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser() {
        UserProfileResponse response = authService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved successfully", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất", description = "Đăng xuất người dùng hiện tại bằng cách đưa token vào blacklist (yêu cầu JWT hợp lệ).")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            authService.logout(token);
        }
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công."));
    }

    // request reset password
    @PostMapping("/forgot-password")
    @Operation(summary = "Yêu cầu đặt lại mật khẩu", description = "Gửi email chứa đường dẫn đặt lại mật khẩu tới địa chỉ email cung cấp. Link có hiệu lực trong 15 phút.")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(PasswordResetMessages.MESSAGE_FORGOT_PASSWORD_SUCCESS));
    }

    @PostMapping("/mobile/forgot-password")
    @Operation(summary = "Yêu cầu OTP đặt lại mật khẩu cho Mobile", description = "Gửi email chứa mã OTP 6 số tới địa chỉ email cung cấp. Mã có hiệu lực trong 15 phút.")
    public ResponseEntity<ApiResponse<Void>> forgotPasswordMobile(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.forgotPasswordMobile(request);
        return ResponseEntity.ok(ApiResponse.success("Mã xác nhận đã được gửi tới Email của bạn."));
    }

    // after verify token, reset password
    @PostMapping("/reset-password")
    @Operation(summary = "Đặt lại mật khẩu", description = "Đặt lại mật khẩu bằng token nhận được qua email.")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(PasswordResetMessages.MESSAGE_RESET_PASSWORD_SUCCESS));
    }

    // verify token
    @GetMapping("/validate-reset-token")
    @Operation(summary = "Kiểm tra token đặt lại mật khẩu", description = "Kiểm tra token đặt lại mật khẩu còn hiệu lực hay không.")
    public ResponseEntity<ApiResponse<Boolean>> validateResetToken(@RequestParam String token) {
        boolean isValid = passwordResetService.validateToken(token);
        if (isValid) {
            return ResponseEntity.ok(ApiResponse.success(PasswordResetMessages.MESSAGE_TOKEN_VALID, true));
        } else {
            return ResponseEntity.ok(ApiResponse.error(PasswordResetMessages.MESSAGE_TOKEN_INVALID, false));
        }
    }

    // ========= Guest OTP Login cho booking =========

    @PostMapping("/guest-login/verify-otp")
    @Operation(summary = "Đăng nhập OTP cho khách vãng lai (booking)", description = "Đăng nhập bằng mã OTP đã gửi tới email. Thành công sẽ trả về access/refresh token.")
    public ResponseEntity<ApiResponse<TokenResponse>> guestLoginWithOtp(@Valid @RequestBody VerifyOtpRequest request) {
        TokenResponse response = authService.loginWithOtpForEmail(request.email(), request.otpCode());
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập OTP thành công.", response));
    }

    @PostMapping("/google")
    @Operation(summary = "Đăng nhập bằng Google", description = "Xác thực Id Token từ Google và trả về access/refresh token.")
    public ResponseEntity<ApiResponse<TokenResponse>> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        TokenResponse response = authService.loginWithGoogle(request.idToken());
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập Google thành công.", response));
    }

    @PostMapping("/setup-password")
    @Operation(summary = "Thiết lập mật khẩu khởi tạo", description = "Thiết lập mật khẩu lần đầu cho các tài khoản đăng nhập qua mạng xã hội (buộc phải có cờ mustChangePassword = true).")
    public ResponseEntity<ApiResponse<Void>> setupInitialPassword(@Valid @RequestBody fpt.teddypet.application.dto.request.auth.SetupPasswordRequest request) {
        authService.setupInitialPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Thiết lập mật khẩu thành công."));
    }

}

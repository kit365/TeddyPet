package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.auth.ChangePasswordRequest;
import fpt.teddypet.application.dto.request.auth.LoginRequest;
import fpt.teddypet.application.dto.request.auth.RegisterRequest;
import fpt.teddypet.application.dto.request.auth.ResendEmailRequest;
import fpt.teddypet.application.dto.request.auth.ChangeUnverifiedEmailRequest;
import fpt.teddypet.application.dto.response.AuthResponse;
import fpt.teddypet.application.dto.response.RegisterResponse;
import fpt.teddypet.application.dto.response.TokenResponse;
import fpt.teddypet.application.dto.response.UserProfileResponse;
import fpt.teddypet.domain.entity.User;

public interface AuthService {
    void register(RegisterRequest request);

    /**
     * Register and return response with resend cooldown info
     */
    RegisterResponse registerWithResponse(RegisterRequest request);

    /**
     * Register for mobile - sends OTP instead of email verification link
     */
    RegisterResponse registerMobile(RegisterRequest request);

    /**
     * Verify registration OTP for mobile - activates account after OTP verification
     */
    TokenResponse verifyRegisterOtp(String email, String otpCode);

    AuthResponse login(LoginRequest request);

    /**
     * Login and return only the token (no user info)
     */
    TokenResponse loginForToken(LoginRequest request);

    /**
     * Login bằng OTP cho email (đã được gửi/kiểm tra OTP trước đó).
     */
    TokenResponse loginWithOtpForEmail(String email, String otpCode);

    User getCurrentUser();

    /**
     * Get current authenticated user's profile information
     */
    UserProfileResponse getCurrentUserProfile();

    AuthResponse verifyEmail(String token);

    /**
     * Verify email and return only the token (no user info)
     */
    TokenResponse verifyEmailForToken(String token);

    /**
     * Resend verification email
     */
    RegisterResponse resendVerificationEmail(ResendEmailRequest request);

    /**
     * Refresh access token using refresh token
     */
    TokenResponse refreshToken(String refreshToken);

    /**
     * Logout user by blacklisting the current token
     */
    void logout(String token);

    void changePassword(ChangePasswordRequest request);

    /**
     * Xác thực mật khẩu hiện tại của người dùng đang đăng nhập
     */
    void verifyCurrentPassword(String password);

    /**
     * Đổi email cho tài khoản chưa xác thực (nếu nhập sai email khi đăng ký)
     */
    RegisterResponse changeUnverifiedEmail(ChangeUnverifiedEmailRequest request);

    /**
     * Đăng nhập bằng Google Id Token
     */
    TokenResponse loginWithGoogle(String idToken);

    TokenResponse processGoogleUser(String email, String firstName, String lastName, String avatarUrl);

    void setupInitialPassword(fpt.teddypet.application.dto.request.auth.SetupPasswordRequest request);
}

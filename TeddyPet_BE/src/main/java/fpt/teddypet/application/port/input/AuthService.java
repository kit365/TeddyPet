package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.auth.LoginRequest;
import fpt.teddypet.application.dto.request.auth.RegisterRequest;
import fpt.teddypet.application.dto.request.auth.ResendEmailRequest;
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

    AuthResponse login(LoginRequest request);

    /**
     * Login and return only the token (no user info)
     */
    TokenResponse loginForToken(LoginRequest request);

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
}

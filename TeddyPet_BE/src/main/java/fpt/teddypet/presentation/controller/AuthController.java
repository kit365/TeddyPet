package fpt.teddypet.presentation.controller;

import fpt.teddypet.application.constants.auth.AuthMessages;
import fpt.teddypet.application.constants.auth.PasswordResetMessages;
import fpt.teddypet.application.dto.request.auth.ForgotPasswordRequest;
import fpt.teddypet.application.dto.request.auth.LoginRequest;
import fpt.teddypet.application.dto.request.auth.RegisterRequest;
import fpt.teddypet.application.dto.request.auth.ResetPasswordRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.AuthResponse;
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
@Tag(name = "Authentication", description = "Authentication APIs")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Register a new user with email and password")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(AuthMessages.MESSAGE_REGISTER_SUCCESS));
    }

    @PostMapping("/login")
    @Operation(summary = "Login user", description = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(AuthMessages.MESSAGE_LOGIN_SUCCESS, response));
    }

    //request reset password
    @PostMapping("/forgot-password")
    @Operation(
            summary = "Request password reset",
            description = "Send a password reset link to the provided email address. " +
                    "The link will be valid for 15 minutes."
    )
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(PasswordResetMessages.MESSAGE_FORGOT_PASSWORD_SUCCESS));
    }

    // after verify token, reset password
    @PostMapping("/reset-password")
    @Operation(
            summary = "Reset password",
            description = "Reset password using the token received via email"
    )
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(PasswordResetMessages.MESSAGE_RESET_PASSWORD_SUCCESS));
    }

    //verify token
    @GetMapping("/validate-reset-token")
    @Operation(
            summary = "Validate reset token",
            description = "Check if the password reset token is still valid"
    )
    public ResponseEntity<ApiResponse<Boolean>> validateResetToken(@RequestParam String token) {
        boolean isValid = passwordResetService.validateToken(token);
        if (isValid) {
            return ResponseEntity.ok(ApiResponse.success(PasswordResetMessages.MESSAGE_TOKEN_VALID, true));
        } else {
            return ResponseEntity.ok(ApiResponse.error(PasswordResetMessages.MESSAGE_TOKEN_INVALID, false));
        }
    }
}

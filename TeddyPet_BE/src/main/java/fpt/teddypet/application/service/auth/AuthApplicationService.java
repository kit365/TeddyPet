package fpt.teddypet.application.service.auth;

import fpt.teddypet.application.constants.auth.AuthLogMessages;
import fpt.teddypet.application.constants.auth.AuthMessages;
import fpt.teddypet.application.dto.request.auth.LoginRequest;
import fpt.teddypet.application.dto.request.auth.RegisterRequest;
import fpt.teddypet.application.dto.request.auth.ResendEmailRequest;
import fpt.teddypet.application.dto.response.AuthResponse;
import fpt.teddypet.application.dto.response.RegisterResponse;
import fpt.teddypet.application.dto.response.TokenResponse;
import fpt.teddypet.application.dto.response.UserProfileResponse;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.RoleService;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.port.output.JwtTokenProviderPort;
import fpt.teddypet.application.port.output.VerificationTokenPort;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.enums.UserStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthApplicationService implements AuthService {

    private final UserService userService;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProviderPort jwtTokenProviderPort;
    private final AuthenticationManager authenticationManager;
    private final VerificationTokenPort verificationTokenPort;
    private final EmailServicePort emailServicePort;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.verification.resend-cooldown-seconds:120}")
    private int resendCooldownSeconds;

    private AuthResponse generateAuthResponse(User user) {
        String token = jwtTokenProviderPort.generateToken(user.getEmail());
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);

        String roleName = user.getRole().getName();

        return new AuthResponse(
                token,
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                roleName,
                expiresAt);
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        log.info(AuthLogMessages.LOG_AUTH_REGISTER_START, request.email());

        if (userService.existsByEmail(request.email())) {
            log.warn(AuthLogMessages.LOG_AUTH_REGISTER_WARN_EMAIL_EXISTS, request.email());
            throw new IllegalArgumentException(AuthMessages.MESSAGE_EMAIL_DUPLICATE);
        }
        if (userService.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already exists");
        }

        try {

            var defaultRole = roleService.getDefaultRole();

            // Bypass verification for admin@gmail.com (test account)
            boolean isTestAccount = request.email().equalsIgnoreCase("admin@gmail.com");
            UserStatusEnum status = isTestAccount ? UserStatusEnum.ACTIVE : UserStatusEnum.PENDING_VERIFICATION;

            User user = User.builder()
                    .username(request.username())
                    .email(request.email())
                    .password(passwordEncoder.encode(request.password()))
                    .firstName(request.firstName())
                    .lastName(request.lastName())
                    .phoneNumber(request.phoneNumber())
                    .status(status)
                    .role(defaultRole)
                    .build();

            userService.save(user);
            log.info(AuthLogMessages.LOG_AUTH_REGISTER_SUCCESS, user.getId());

            // Email verification flow - Skip for test account
            if (!isTestAccount) {
                String token = UUID.randomUUID().toString();
                verificationTokenPort.saveToken(user.getEmail(), token);
                verificationTokenPort.saveResendCooldown(user.getEmail());

                String verificationLink = frontendUrl + "/verify-email?token=" + token;
                emailServicePort.sendVerificationEmail(user.getEmail(), token, verificationLink);
            } else {
                log.info("[AuthService] Bypassing email verification for test account: {}", request.email());
            }

        } catch (Exception e) {
            log.error(AuthLogMessages.LOG_AUTH_REGISTER_ERROR_DB, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info(AuthLogMessages.LOG_AUTH_LOGIN_START, request.usernameOrEmail());

        try {

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.usernameOrEmail(),
                            request.password()));

            User user = (User) authentication.getPrincipal();

            if (user.getStatus() == UserStatusEnum.PENDING_VERIFICATION) {
                throw new DisabledException(AuthMessages.MESSAGE_EMAIL_NOT_VERIFIED);
            }

            userService.resetFailedLoginAttempts(user);

            log.info(AuthLogMessages.LOG_AUTH_LOGIN_SUCCESS, request.usernameOrEmail());

            return generateAuthResponse(user);
        } catch (BadCredentialsException e) {
            log.warn(AuthLogMessages.LOG_AUTH_LOGIN_ERROR_INVALID_CREDENTIALS, request.usernameOrEmail());

            try {
                User user = userService.getByUsernameOrEmail(request.usernameOrEmail());
                userService.trackFailedLogin(user);
            } catch (Exception ex) {
            }

            throw new BadCredentialsException(AuthMessages.MESSAGE_INVALID_CREDENTIALS);
        } catch (DisabledException e) {
            log.warn("[AuthService] Account disabled for {}: {}", request.usernameOrEmail(), e.getMessage());
            String message = (e.getMessage() != null && e.getMessage().contains("User is disabled"))
                    ? AuthMessages.MESSAGE_EMAIL_NOT_VERIFIED
                    : e.getMessage();
            throw new DisabledException(message);
        }
    }

    @Override
    @Transactional
    public AuthResponse verifyEmail(String token) {
        log.info("[AuthService] Verifying email with token: {}", token);

        String email = verificationTokenPort.findEmailByToken(token)
                .orElseThrow(() -> new IllegalArgumentException(AuthMessages.MESSAGE_INVALID_VERIFY_TOKEN));

        User user = userService.getByEmail(email);

        if (user.getStatus() == UserStatusEnum.ACTIVE) {
            log.warn("[AuthService] Email already verified for: {}", email);
            throw new IllegalStateException(AuthMessages.MESSAGE_EMAIL_ALREADY_VERIFIED);
        }

        user.setStatus(UserStatusEnum.ACTIVE);
        userService.save(user);

        verificationTokenPort.deleteToken(token);

        log.info("[AuthService] Email verified successfully for: {}", email);

        return generateAuthResponse(user);
    }

    @Override
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException(AuthMessages.MESSAGE_USER_NOT_AUTHENTICATED);
        }

        Object principal = authentication.getPrincipal();

        // User entity implements UserDetails, so we can cast directly
        if (principal instanceof User user) {
            return user;
        }

        // Fallback: if principal is a different UserDetails implementation, get by
        // email
        if (principal instanceof UserDetails userDetails) {
            // In our case, User.getUsername() returns username, not email
            // But the JWT token uses email, so we need to get the email from User
            String usernameOrEmail = userDetails.getUsername();
            return userService.getByUsernameOrEmail(usernameOrEmail);
        }

        throw new IllegalStateException(AuthMessages.MESSAGE_CANNOT_DETERMINE_USER);
    }

    /**
     * Generate a TokenResponse containing only the token and expiration time
     */
    private TokenResponse generateTokenResponse(User user) {
        String token = jwtTokenProviderPort.generateToken(user.getEmail());
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);
        return new TokenResponse(token, expiresAt);
    }

    @Override
    @Transactional
    public TokenResponse loginForToken(LoginRequest request) {
        log.info(AuthLogMessages.LOG_AUTH_LOGIN_START, request.usernameOrEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.usernameOrEmail(),
                            request.password()));

            User user = (User) authentication.getPrincipal();

            if (user.getStatus() == UserStatusEnum.PENDING_VERIFICATION) {
                throw new DisabledException(AuthMessages.MESSAGE_EMAIL_NOT_VERIFIED);
            }

            userService.resetFailedLoginAttempts(user);

            log.info(AuthLogMessages.LOG_AUTH_LOGIN_SUCCESS, request.usernameOrEmail());

            return generateTokenResponse(user);
        } catch (BadCredentialsException e) {
            log.warn(AuthLogMessages.LOG_AUTH_LOGIN_ERROR_INVALID_CREDENTIALS, request.usernameOrEmail());

            try {
                User user = userService.getByUsernameOrEmail(request.usernameOrEmail());
                userService.trackFailedLogin(user);
            } catch (Exception ex) {
                // User not found, ignore
            }

            throw new BadCredentialsException(AuthMessages.MESSAGE_INVALID_CREDENTIALS);
        } catch (DisabledException e) {
            log.warn("[AuthService] Account disabled for {}: {}", request.usernameOrEmail(), e.getMessage());
            String message = (e.getMessage() != null && e.getMessage().contains("User is disabled"))
                    ? AuthMessages.MESSAGE_EMAIL_NOT_VERIFIED
                    : e.getMessage();
            throw new DisabledException(message);
        }
    }

    @Override
    @Transactional
    public TokenResponse verifyEmailForToken(String token) {
        log.info("[AuthService] Verifying email with token: {}", token);

        String email = verificationTokenPort.findEmailByToken(token)
                .orElseThrow(() -> new IllegalArgumentException(AuthMessages.MESSAGE_INVALID_VERIFY_TOKEN));

        User user = userService.getByEmail(email);

        if (user.getStatus() == UserStatusEnum.ACTIVE) {
            log.warn("[AuthService] Email already verified for: {}", email);
            throw new IllegalStateException(AuthMessages.MESSAGE_EMAIL_ALREADY_VERIFIED);
        }

        user.setStatus(UserStatusEnum.ACTIVE);
        userService.save(user);

        verificationTokenPort.deleteToken(token);

        log.info("[AuthService] Email verified successfully for: {}", email);

        return generateTokenResponse(user);
    }

    @Override
    public UserProfileResponse getCurrentUserProfile() {
        User user = getCurrentUser();
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhoneNumber(),
                user.getAvatarUrl(),
                user.getAltImage(),
                user.getGender(),
                user.getDateOfBirth(),
                user.getStatus(),
                user.getRole().getName());
    }

    @Override
    @Transactional
    public RegisterResponse registerWithResponse(RegisterRequest request) {
        log.info(AuthLogMessages.LOG_AUTH_REGISTER_START, request.email());

        if (userService.existsByEmail(request.email())) {
            log.warn(AuthLogMessages.LOG_AUTH_REGISTER_WARN_EMAIL_EXISTS, request.email());
            throw new IllegalArgumentException(AuthMessages.MESSAGE_EMAIL_DUPLICATE);
        }
        if (userService.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already exists");
        }

        try {
            var defaultRole = roleService.getDefaultRole();

            // Bypass verification for admin@gmail.com (test account)
            boolean isTestAccount = request.email().equalsIgnoreCase("admin@gmail.com");
            UserStatusEnum status = isTestAccount ? UserStatusEnum.ACTIVE : UserStatusEnum.PENDING_VERIFICATION;

            User user = User.builder()
                    .username(request.username())
                    .email(request.email())
                    .password(passwordEncoder.encode(request.password()))
                    .firstName(request.firstName())
                    .lastName(request.lastName())
                    .phoneNumber(request.phoneNumber())
                    .status(status)
                    .role(defaultRole)
                    .build();

            userService.save(user);
            log.info(AuthLogMessages.LOG_AUTH_REGISTER_SUCCESS, user.getId());

            // Email verification flow - Skip for test account
            if (!isTestAccount) {
                String token = UUID.randomUUID().toString();
                verificationTokenPort.saveToken(user.getEmail(), token);
                verificationTokenPort.saveResendCooldown(user.getEmail());

                String verificationLink = frontendUrl + "/verify-email?token=" + token;
                emailServicePort.sendVerificationEmail(user.getEmail(), token, verificationLink);

                return new RegisterResponse(
                        AuthMessages.MESSAGE_REGISTER_SUCCESS,
                        resendCooldownSeconds,
                        LocalDateTime.now().plusSeconds(resendCooldownSeconds));
            } else {
                log.info("[AuthService] Bypassing email verification for test account: {}", request.email());
                return new RegisterResponse(
                        AuthMessages.MESSAGE_REGISTER_SUCCESS,
                        0,
                        LocalDateTime.now());
            }

        } catch (Exception e) {
            log.error(AuthLogMessages.LOG_AUTH_REGISTER_ERROR_DB, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public RegisterResponse resendVerificationEmail(ResendEmailRequest request) {
        log.info("[AuthService] Resend verification email for: {}", request.email());

        // Check if user exists
        User user = userService.getByEmail(request.email());

        // Check if already verified
        if (user.getStatus() == UserStatusEnum.ACTIVE) {
            throw new IllegalStateException(AuthMessages.MESSAGE_EMAIL_ALREADY_VERIFIED);
        }

        // Check cooldown
        long remainingCooldown = verificationTokenPort.getResendCooldownSeconds(request.email());
        if (remainingCooldown > 0) {
            throw new IllegalStateException(
                    String.format("Vui lòng đợi %d giây trước khi gửi lại email xác thực.", remainingCooldown));
        }

        // Delete old token if exists
        verificationTokenPort.findTokenByEmail(request.email())
                .ifPresent(verificationTokenPort::deleteToken);

        // Generate new token and send email
        String token = UUID.randomUUID().toString();
        verificationTokenPort.saveToken(user.getEmail(), token);
        verificationTokenPort.saveResendCooldown(user.getEmail());

        String verificationLink = frontendUrl + "/verify-email?token=" + token;
        emailServicePort.sendVerificationEmail(user.getEmail(), token, verificationLink);

        log.info("[AuthService] Verification email resent to: {}", request.email());

        return new RegisterResponse(
                "Email xác thực đã được gửi lại thành công.",
                resendCooldownSeconds,
                LocalDateTime.now().plusSeconds(resendCooldownSeconds));
    }

    @Override
    public void logout(String token) {
        log.info("[AuthService] Logging out user");
        jwtTokenProviderPort.blacklistToken(token);
        log.info("[AuthService] User logged out successfully");
    }
}

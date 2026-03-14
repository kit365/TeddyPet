package fpt.teddypet.application.service.auth;

import fpt.teddypet.application.constants.auth.AuthLogMessages;
import fpt.teddypet.application.constants.auth.AuthMessages;
import fpt.teddypet.application.dto.request.auth.LoginRequest;
import fpt.teddypet.application.dto.request.auth.RegisterRequest;
import fpt.teddypet.application.dto.request.auth.ResendEmailRequest;
import fpt.teddypet.application.dto.request.auth.ChangeUnverifiedEmailRequest;
import fpt.teddypet.application.dto.response.AuthResponse;
import fpt.teddypet.application.dto.response.RegisterResponse;
import fpt.teddypet.application.dto.response.TokenResponse;
import fpt.teddypet.application.dto.response.UserProfileResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import fpt.teddypet.application.port.output.AdminGoogleWhitelistPort;
import jakarta.annotation.PostConstruct;
import java.util.Collections;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.RoleService;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.port.output.JwtTokenProviderPort;
import fpt.teddypet.application.port.output.VerificationTokenPort;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.entity.Role;
import fpt.teddypet.domain.enums.RoleEnum;
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
import java.util.Optional;
import java.util.UUID;

import fpt.teddypet.application.dto.request.auth.ChangePasswordRequest;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthApplicationService implements AuthService {

    private static final HttpTransport HTTP_TRANSPORT = new NetHttpTransport();
    private static final JsonFactory JSON_FACTORY = new GsonFactory();

    private final UserService userService;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProviderPort jwtTokenProviderPort;
    private final AuthenticationManager authenticationManager;
    private final VerificationTokenPort verificationTokenPort;
    private final EmailServicePort emailServicePort;
    private final AdminGoogleWhitelistPort adminGoogleWhitelistPort;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.verification.resend-cooldown-seconds:120}")
    private int resendCooldownSeconds;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Value("${app.google.allowed-admin-emails:}")
    private String googleAllowedAdminEmails;

    private GoogleIdTokenVerifier googleVerifier;

    @PostConstruct
    public void init() {
        this.googleVerifier = new GoogleIdTokenVerifier.Builder(HTTP_TRANSPORT, JSON_FACTORY)
                .setAudience(Collections.singletonList(googleClientId))
                .build();
    }

    private String formatName(String name) {
        if (name == null || name.isBlank()) return "";
        String[] words = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                sb.append(Character.toUpperCase(word.charAt(0)))
                  .append(word.substring(1).toLowerCase())
                  .append(" ");
            }
        }
        return sb.toString().trim();
    }

    private AuthResponse generateAuthResponse(User user) {
        String token = jwtTokenProviderPort.generateToken(user.getEmail());
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);

        String roleName = user.getRole().getName();

        return new AuthResponse(
                user.getId(),
                token,
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                roleName,
                expiresAt,
                user.getMustChangePassword() != null ? user.getMustChangePassword() : false);
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
            throw new IllegalArgumentException(AuthMessages.MESSAGE_USERNAME_DUPLICATE);
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
                log.info(AuthLogMessages.LOG_AUTH_BYPASS_VERIFICATION, request.email());
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
            log.warn(AuthLogMessages.LOG_AUTH_LOGIN_ERROR_ACCOUNT_DISABLED, request.usernameOrEmail(), e.getMessage());
            String message = (e.getMessage() != null && e.getMessage().contains(AuthMessages.MESSAGE_USER_IS_DISABLED))
                    ? AuthMessages.MESSAGE_EMAIL_NOT_VERIFIED
                    : e.getMessage();
            throw new DisabledException(message);
        }
    }

    @Override
    @Transactional
    public AuthResponse verifyEmail(String token) {
        log.info(AuthLogMessages.LOG_AUTH_VERIFY_EMAIL_START, token);

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

        log.info(AuthLogMessages.LOG_AUTH_EMAIL_VERIFIED_SUCCESS, email);

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
        String refreshToken = jwtTokenProviderPort.generateRefreshToken(user.getEmail());

        jwtTokenProviderPort.saveRefreshToken(user.getEmail(), refreshToken);

        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);
        
        // Ensure mustChangePassword is never null in our response
        Boolean mustChange = Boolean.TRUE.equals(user.getMustChangePassword());
        
        return new TokenResponse(token, refreshToken, expiresAt, mustChange);
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
    public TokenResponse loginWithOtpForEmail(String email, String otpCode) {
        if (otpCode == null || otpCode.isBlank()) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_OTP_REQUIRED);
        }

        Optional<String> storedOtp = verificationTokenPort.getGuestOtp(email);
        if (storedOtp.isEmpty() || !storedOtp.get().equals(otpCode)) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_OTP_INVALID);
        }

        User user = userService.getByEmail(email);
        if (user.getStatus() == UserStatusEnum.PENDING_VERIFICATION) {
            throw new DisabledException(AuthMessages.MESSAGE_EMAIL_NOT_VERIFIED);
        }

        // OTP hợp lệ -> xóa để tránh reuse
        verificationTokenPort.deleteGuestOtp(email);

        return generateTokenResponse(user);
    }

    public TokenResponse processGoogleUser(String email, String firstName, String lastName, String avatarUrl) {
        log.info("[AuthService] Đang xử lý người dùng Google: {}", email);
        
        String fixedFirstName = formatName(firstName);
        String fixedLastName = formatName(lastName);

        // 1. Kiểm tra trong danh sách admin cứng (Env/Config)
        boolean isDefaultAdmin = false;
        if (googleAllowedAdminEmails != null && !googleAllowedAdminEmails.isBlank()) {
            isDefaultAdmin = java.util.Arrays.asList(googleAllowedAdminEmails.split(","))
                    .stream().anyMatch(e -> e.trim().equalsIgnoreCase(email));
        }

        // 2. Kiểm tra trong database whitelist
        Optional<fpt.teddypet.domain.entity.AdminGoogleWhitelist> whitelistOpt = adminGoogleWhitelistPort.findByEmail(email);
        boolean isWhitelistedInDb = whitelistOpt.isPresent() && "ACCEPTED".equals(whitelistOpt.get().getStatus());
        
        String assignedRole = RoleEnum.USER.name();
        if (isDefaultAdmin) {
            assignedRole = "admin@gmail.com".equalsIgnoreCase(email) ? RoleEnum.SUPER_ADMIN.name() : RoleEnum.ADMIN.name();
        } else if (isWhitelistedInDb) {
            assignedRole = whitelistOpt.get().getRole();
        }

        // Remove strict whitelist blocking to allow normal users to login via Google
        // They will default to assignedRole = RoleEnum.USER.name()

        User user;
        if (userService.existsByEmail(email)) {
            user = userService.getByEmail(email);
            
            String dbRoleName = user.getRole().getName();
            // Robust check for staff/admin roles (handling potential ROLE_ prefix)
            boolean isStaffInDb = !dbRoleName.equalsIgnoreCase(RoleEnum.USER.name()) && 
                                  !dbRoleName.equalsIgnoreCase("ROLE_" + RoleEnum.USER.name());
            boolean isWhitelistedForGoogle = !assignedRole.equals(RoleEnum.USER.name());

            // Case: Invited Staff/Admin (Pending). 
            // They MUST verify via the original invitation link (token) first.
            // This is because the token acts as an "Approval/Acceptance" of the invitation.
            // Even if whitelisted for Google, a pending invitation must still be accepted manually via the token link.
            if (user.getStatus() == UserStatusEnum.PENDING_VERIFICATION && isStaffInDb) {
                log.warn("[AuthService] Một tài khoản nhân viên chưa kích hoạt ({}) cố tình dùng Google để bỏ qua bước xác thực lời mời.", email);
                throw new IllegalArgumentException("Tài khoản này đang trong trạng thái chờ kích hoạt (Lời mời nhân viên). Vui lòng xác thực qua liên kết trong email mời của bạn để chính thức 'Chấp thuận tham gia hệ thống' trước khi sử dụng Google Login.");
            }

            // Auto-verify ONLY for normal users (Customers/USER role) or already active staff.
            user.setStatus(UserStatusEnum.ACTIVE);
            
            // Update profile info
            user.setFirstName(fixedFirstName);
            user.setLastName(fixedLastName);
            user.setAvatarUrl(avatarUrl);
            
            // Role assignment logic:
            // 1. If whitelisted for Google -> Upgrade/Assign to that privileged role
            // 2. If currently a plain USER -> Can be assigned/updated to USER (default)
            // 3. Otherwise (is a Staff not in Google Whitelist) -> DO NOT downgrade role to USER
            if (isWhitelistedForGoogle || user.getRole().getName().equals(RoleEnum.USER.name())) {
                Role newRole = roleService.findByName(assignedRole);
                user.setRole(newRole);
            }
            
            // Respect user's wish: if already exists, don't force change unless already set
            if (user.getMustChangePassword() == null) {
                user.setMustChangePassword(false);
            }
            
            user = userService.save(user);
        } else {
            log.info("[AuthService] Tạo người dùng mới từ Google: {} với quyền: {}", email, assignedRole);
            Role role = roleService.findByName(assignedRole);
            
            user = User.builder()
                    .email(email)
                    .username(email)
                    .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .firstName(fixedFirstName)
                    .lastName(fixedLastName)
                    .avatarUrl(avatarUrl)
                    .status(UserStatusEnum.ACTIVE)
                    .role(role)
                    .mustChangePassword(true) // Force setup for completely new accounts
                    .build();
            user = userService.save(user);
        }

        return generateTokenResponse(user);
    }

    @Override
    @Transactional
    public TokenResponse loginWithGoogle(String idTokenString) {
        log.info("[AuthService] Đang xác thực Google Id Token...");
        long startTime = System.currentTimeMillis();
        try {
            GoogleIdToken idToken = googleVerifier.verify(idTokenString);
            long endTime = System.currentTimeMillis();
            log.info("[AuthService] Xác thực Google hoàn tất trong {} ms", (endTime - startTime));
            
            if (idToken == null) {
                log.error("[AuthService] Google Id Token không hợp lệ");
                throw new IllegalArgumentException("Google Id Token không hợp lệ hoặc đã hết hạn");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String firstName = (String) payload.get("given_name");
            String lastName = (String) payload.get("family_name");
            String avatarUrl = (String) payload.get("picture");

            return processGoogleUser(email, firstName, lastName, avatarUrl);
        } catch (Exception e) {
            log.error("[AuthService] Lỗi khi đăng nhập bằng Google: {}", e.getMessage());
            throw new RuntimeException("Lỗi xác thực Google: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public TokenResponse verifyEmailForToken(String token) {
        log.info(AuthLogMessages.LOG_AUTH_VERIFY_EMAIL_START, token);

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
                user.getCreatedAt(),
                user.getStatus(),
                user.getRole().getName(),
                Boolean.TRUE.equals(user.getMustChangePassword()),
                user.getBackupEmail());
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
            throw new IllegalArgumentException(AuthMessages.MESSAGE_USERNAME_DUPLICATE);
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
                log.info(AuthLogMessages.LOG_AUTH_BYPASS_VERIFICATION, request.email());
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
    public RegisterResponse registerMobile(RegisterRequest request) {
        log.info("[AuthService] Mobile register start for: {}", request.email());

        if (userService.existsByEmail(request.email())) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_EMAIL_DUPLICATE);
        }
        if (userService.existsByUsername(request.username())) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_USERNAME_DUPLICATE);
        }

        try {
            var defaultRole = roleService.getDefaultRole();

            User user = User.builder()
                    .username(request.username())
                    .email(request.email())
                    .password(passwordEncoder.encode(request.password()))
                    .firstName(request.firstName())
                    .lastName(request.lastName())
                    .phoneNumber(request.phoneNumber())
                    .status(UserStatusEnum.PENDING_VERIFICATION)
                    .role(defaultRole)
                    .build();

            userService.save(user);
            log.info("[AuthService] Mobile register saved user: {}", user.getId());

            // Generate OTP and send via email (reuse existing OTP infrastructure)
            String otp = generateOtp();
            verificationTokenPort.saveGuestOtp(user.getEmail(), otp);
            verificationTokenPort.saveResendCooldown(user.getEmail());
            emailServicePort.sendSecurityOtp(user.getEmail(), otp);

            return new RegisterResponse(
                    AuthMessages.MESSAGE_REGISTER_SUCCESS + " Mã OTP đã được gửi đến email của bạn.",
                    resendCooldownSeconds,
                    LocalDateTime.now().plusSeconds(resendCooldownSeconds));

        } catch (Exception e) {
            log.error(AuthLogMessages.LOG_AUTH_REGISTER_ERROR_DB, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public TokenResponse verifyRegisterOtp(String email, String otpCode) {
        log.info("[AuthService] Verify register OTP for: {}", email);

        if (otpCode == null || otpCode.isBlank()) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_OTP_REQUIRED);
        }

        // Validate OTP
        java.util.Optional<String> storedOtp = verificationTokenPort.getGuestOtp(email);
        if (storedOtp.isEmpty() || !storedOtp.get().equals(otpCode)) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_OTP_INVALID);
        }

        // Activate user
        User user = userService.getByEmail(email);
        if (user.getStatus() == UserStatusEnum.ACTIVE) {
            throw new IllegalStateException(AuthMessages.MESSAGE_EMAIL_ALREADY_VERIFIED);
        }

        user.setStatus(UserStatusEnum.ACTIVE);
        userService.save(user);

        // Cleanup OTP
        verificationTokenPort.deleteGuestOtp(email);

        log.info("[AuthService] Mobile register verified for: {}", email);

        // Auto login after verification
        return generateTokenResponse(user);
    }

    private String generateOtp() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    @Override
    @Transactional
    public RegisterResponse resendVerificationEmail(ResendEmailRequest request) {
        log.info(AuthLogMessages.LOG_AUTH_RESEND_EMAIL, request.email());

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
                    String.format(AuthMessages.MESSAGE_WAIT_FOR_COOLDOWN, remainingCooldown));
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

        log.info(AuthLogMessages.LOG_AUTH_RESEND_VERIFICATION_EMAIL_SUCCESS, request.email());

        return new RegisterResponse(
                AuthMessages.MESSAGE_RESEND_EMAIL_SUCCESS,
                resendCooldownSeconds,
                LocalDateTime.now().plusSeconds(resendCooldownSeconds));
    }

    @Override
    public TokenResponse refreshToken(String refreshToken) {
        if (!jwtTokenProviderPort.validateToken(refreshToken)) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_INVALID_REFRESH_TOKEN);
        }

        String email = jwtTokenProviderPort.extractEmail(refreshToken);
        String storedToken = jwtTokenProviderPort.getRefreshToken(email);

        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_EXPIRED_REFRESH_TOKEN);
        }

        User user = userService.getByEmail(email);
        return generateTokenResponse(user);
    }

    @Override
    @Transactional
    public void logout(String token) {
        log.info(AuthLogMessages.LOG_AUTH_LOGOUT_START);
        jwtTokenProviderPort.blacklistToken(token);

        // Also delete refresh token
        try {
            String email = jwtTokenProviderPort.extractEmail(token);
            if (email != null) {
                jwtTokenProviderPort.deleteRefreshToken(email);
            }
        } catch (Exception e) {
            log.warn(AuthLogMessages.LOG_AUTH_TOKEN_EXTRACT_ERROR);
        }

        log.info(AuthLogMessages.LOG_AUTH_LOGOUT_SUCCESS);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();
        log.info(AuthLogMessages.LOG_AUTH_CHANGE_PASSWORD_START, user.getUsername());

        // 1. Verify old password
        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_OLD_PASSWORD_INCORRECT);
        }

        // 2. Verify new password not same as old
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_NEW_PASSWORD_SAME_AS_OLD);
        }

        // 3. Verify OTP
        Optional<String> storedOtp = verificationTokenPort.getGuestOtp(user.getEmail());
        if (storedOtp.isEmpty() || !storedOtp.get().equals(request.otpCode())) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_OTP_INVALID);
        }

        // 4. Update password
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userService.save(user);

        // 5. Clear OTP and Cooldown
        verificationTokenPort.deleteGuestOtp(user.getEmail());

        log.info(AuthLogMessages.LOG_AUTH_CHANGE_PASSWORD_SUCCESS, user.getUsername());
    }

    @Override
    public void verifyCurrentPassword(String password) {
        User user = getCurrentUser();
        log.info("[AuthService] Đang xác thực mật khẩu hiện tại cho người dùng: {}", user.getUsername());

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_OLD_PASSWORD_INCORRECT);
        }

        log.info("[AuthService] Xác thực mật khẩu hiện tại thành công cho người dùng: {}", user.getUsername());
    }

    @Override
    @Transactional
    public RegisterResponse changeUnverifiedEmail(ChangeUnverifiedEmailRequest request) {
        log.info(AuthLogMessages.LOG_AUTH_CHANGE_EMAIL_START, request.oldEmail(), request.newEmail());

        // 1. Tìm user theo email cũ
        User user = userService.getByEmail(request.oldEmail());

        // 2. Kiểm tra xem user có phải đang PENDING_VERIFICATION không
        if (user.getStatus() != UserStatusEnum.PENDING_VERIFICATION) {
            throw new IllegalStateException(AuthMessages.MESSAGE_EMAIL_ALREADY_VERIFIED);
        }

        // 3. Kiểm tra mật khẩu
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_INVALID_CREDENTIALS);
        }

        // 4. Kiểm tra xem email mới có bị ai dùng chưa
        if (userService.existsByEmail(request.newEmail())) {
            throw new IllegalArgumentException(AuthMessages.MESSAGE_EMAIL_DUPLICATE);
        }

        // 5. Cập nhật email cho user
        user.setEmail(request.newEmail());
        userService.save(user);

        // 6. Xóa token cũ của email cũ (vì key của token store có thể là email)
        verificationTokenPort.findTokenByEmail(request.oldEmail())
                .ifPresent(verificationTokenPort::deleteToken);

        // 7. Tạo token mới cho email mới và gửi mail
        String token = UUID.randomUUID().toString();
        verificationTokenPort.saveToken(user.getEmail(), token);
        verificationTokenPort.saveResendCooldown(user.getEmail());

        String verificationLink = frontendUrl + "/verify-email?token=" + token;
        emailServicePort.sendVerificationEmail(user.getEmail(), token, verificationLink);

        return new RegisterResponse(
                AuthMessages.MESSAGE_EMAIL_CHANGE_SUCCESS,
                resendCooldownSeconds,
                LocalDateTime.now().plusSeconds(resendCooldownSeconds));
    }

    @Override
    @Transactional
    public TokenResponse verifyInvitationForToken(String token) {
        log.info("[AuthService] Đang xác thực mã mời: {}", token);
        
        fpt.teddypet.domain.entity.AdminGoogleWhitelist whitelist = adminGoogleWhitelistPort.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Mã mời không tồn tại hoặc đã bị hủy."));

        if (whitelist.getTokenExpiredAt().isBefore(LocalDateTime.now())) {
            whitelist.setStatus("EXPIRED");
            adminGoogleWhitelistPort.save(whitelist);
            throw new IllegalArgumentException("Lời mời này đã quá hạn (24 giờ). Vui lòng yêu cầu Admin gửi lại.");
        }

<<<<<<< HEAD
        if ("ACCEPTED".equals(whitelist.getStatus())) {
            // Vẫn cho phép lấy token nếu đã confirm nhưng chưa set pass (phòng trường hợp refresh trang)
            User existingUser = userService.getByEmail(whitelist.getEmail());
=======
        if ("COMPLETED".equals(whitelist.getStatus())) {
            throw new IllegalArgumentException("Mã mời này đã được sử dụng và hoàn thiện thiết lập. Vui lòng đăng nhập bình thường.");
        }

        if ("ACCEPTED".equals(whitelist.getStatus())) {
            // Kiểm tra xem User thực sự đã đổi pass chưa (phòng trường hợp status chưa sync)
            User existingUser = userService.getByEmail(whitelist.getEmail());
            if (!Boolean.TRUE.equals(existingUser.getMustChangePassword())) {
                whitelist.setStatus("COMPLETED");
                adminGoogleWhitelistPort.save(whitelist);
                throw new IllegalArgumentException("Mã mời này đã được hoàn thiện. Vui lòng đăng nhập bằng mật khẩu của bạn.");
            }
            // Vẫn cho phép lấy token nếu đã confirm nhưng chưa set pass (phòng trường hợp refresh trang)
>>>>>>> develop
            return generateTokenResponse(existingUser);
        }

        // Đánh dấu đã xác nhận
        whitelist.setStatus("ACCEPTED");
        whitelist.setConfirmedAt(LocalDateTime.now());
        adminGoogleWhitelistPort.save(whitelist);

        // Tìm hoặc tạo User tương ứng
        User user;
        if (userService.existsByEmail(whitelist.getEmail())) {
            user = userService.getByEmail(whitelist.getEmail());
            // Cập nhật role từ whitelist
            user.setRole(roleService.findByName(whitelist.getRole()));
        } else {
            // Tạo User mới hoàn toàn
            Role role = roleService.findByName(whitelist.getRole());
            user = User.builder()
                    .email(whitelist.getEmail())
                    .username(whitelist.getEmail())
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .firstName(formatName(whitelist.getEmail().split("@")[0]))
                    .lastName("Staff")
                    .status(UserStatusEnum.ACTIVE)
                    .role(role)
                    .build();
        }
        
        // Luôn ép đổi mật khẩu cho luồng mời qua Email này
        user.setMustChangePassword(true);
        user = userService.save(user);

        log.info("[AuthService] Xác thực mã mời thành công cho: {}", whitelist.getEmail());
        
        // Trả về Token để tự động đăng nhập tạm thời
        return generateTokenResponse(user);
    }

    @Override
    @Transactional
    public void setupInitialPassword(fpt.teddypet.application.dto.request.auth.SetupPasswordRequest request) {
        User currentUser = getCurrentUser();
        // Load fresh from DB to avoid stale object from SecurityContext
        User user = userService.getByEmail(currentUser.getEmail());
        
        if (!Boolean.TRUE.equals(user.getMustChangePassword())) {
            // Check if user already has a password set. If yes, consider it a success/already done.
            if (user.getPassword() != null && !user.getPassword().isBlank()) {
                log.info("[AuthService] setupInitialPassword called for user {} who already has a password.", user.getUsername());
                return;
            }
            throw new IllegalStateException("Người dùng này không được yêu cầu đổi mật khẩu khởi tạo.");
        }

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setMustChangePassword(false);
        userService.save(user);

        // Đánh dấu mã mời đã hoàn tất để vô hiệu hóa link trong Email
        adminGoogleWhitelistPort.findByEmail(user.getEmail().toLowerCase().trim())
                .ifPresent(w -> {
                    w.setStatus("COMPLETED");
                    adminGoogleWhitelistPort.save(w);
                });
    }
}

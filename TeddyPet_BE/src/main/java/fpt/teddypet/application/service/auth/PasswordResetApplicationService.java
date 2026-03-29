package fpt.teddypet.application.service.auth;

import fpt.teddypet.application.constants.auth.PasswordResetLogMessages;
import fpt.teddypet.application.constants.auth.PasswordResetMessages;
import fpt.teddypet.application.dto.request.auth.ForgotPasswordRequest;
import fpt.teddypet.application.dto.request.auth.ResetPasswordRequest;
import fpt.teddypet.application.port.input.PasswordResetService;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.port.output.PasswordResetTokenPort;
import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.application.port.output.auth.CredentialReissueHistoryPort;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.entity.auth.CredentialReissueHistory;
import fpt.teddypet.domain.enums.RoleEnum;
import fpt.teddypet.domain.enums.UserStatusEnum;
import fpt.teddypet.domain.enums.auth.CredentialReissueEventType;
import fpt.teddypet.domain.enums.auth.CredentialReissueStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetApplicationService implements PasswordResetService {

    private final PasswordResetTokenPort passwordResetTokenPort;
    private final EmailServicePort emailServicePort;
    private final UserRepositoryPort userRepositoryPort;
    private final PasswordEncoder passwordEncoder;
    private final CredentialReissueHistoryPort credentialReissueHistoryPort;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.password-reset.token-expiration-minutes:15}")
    private int tokenExpirationMinutes;

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        log.info(PasswordResetLogMessages.LOG_FORGOT_PASSWORD_START, request.email());

        // Kiểm tra User có tồn tại không
        User user = userRepositoryPort.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException(PasswordResetMessages.MESSAGE_EMAIL_NOT_FOUND));

        // Kiểm tra User có active không
        if (user.getStatus() == UserStatusEnum.PENDING_VERIFICATION) {
            log.warn("[PasswordResetService] Email chưa được xác thực: {}", request.email());
            throw new IllegalArgumentException(PasswordResetMessages.MESSAGE_EMAIL_NOT_VERIFIED);
        }

        if (user.getStatus() != UserStatusEnum.ACTIVE) {
            log.warn(PasswordResetLogMessages.LOG_FORGOT_PASSWORD_USER_NOT_ACTIVE, request.email());
            throw new IllegalArgumentException(PasswordResetMessages.MESSAGE_USER_NOT_ACTIVE);
        }

        recordForgotPasswordSelfServiceIfCustomer(user);

        String token = generateResetToken();

        passwordResetTokenPort.saveToken(request.email(), token);
        log.info(PasswordResetLogMessages.LOG_FORGOT_PASSWORD_TOKEN_GENERATED, request.email());

        try {
            sendPasswordResetEmail(user, token);
            log.info(PasswordResetLogMessages.LOG_FORGOT_PASSWORD_EMAIL_SENT, request.email());
        } catch (Exception e) {
            log.error(PasswordResetLogMessages.LOG_FORGOT_PASSWORD_EMAIL_FAILED, request.email(), e);
        }
    }

    @Override
    @Transactional
    public void forgotPasswordMobile(ForgotPasswordRequest request) {
        log.info("[PasswordResetService] Bắt đầu yêu cầu OTP Mobile cho email: {}", request.email());

        // Kiểm tra User có tồn tại không
        User user = userRepositoryPort.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException(PasswordResetMessages.MESSAGE_EMAIL_NOT_FOUND));

        // Kiểm tra User có active không
        if (user.getStatus() == UserStatusEnum.PENDING_VERIFICATION) {
            throw new IllegalArgumentException(PasswordResetMessages.MESSAGE_EMAIL_NOT_VERIFIED);
        }

        if (user.getStatus() != UserStatusEnum.ACTIVE) {
            throw new IllegalArgumentException(PasswordResetMessages.MESSAGE_USER_NOT_ACTIVE);
        }

        String otp = generateMobileResetToken();

        // Lưu OTP vào Redis
        passwordResetTokenPort.saveToken(request.email(), otp);
        log.info("[PasswordResetService] Đã tạo OTP Mobile cho email: {}", request.email());

        try {
            // Gửi OTP qua email
            emailServicePort.sendSecurityOtp(user.getEmail(), otp);
            log.info("[PasswordResetService] Đã gửi OTP Mobile thành công tới: {}", request.email());
        } catch (Exception e) {
            log.error("[PasswordResetService] Gửi OTP Mobile thất bại: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info(PasswordResetLogMessages.LOG_RESET_PASSWORD_START);

        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new IllegalArgumentException(PasswordResetMessages.MESSAGE_PASSWORD_NOT_MATCH);
        }

        Optional<String> emailOptional = passwordResetTokenPort.findEmailByToken(request.token());

        if (emailOptional.isEmpty()) {
            log.warn(PasswordResetLogMessages.LOG_RESET_PASSWORD_TOKEN_INVALID);
            throw new IllegalArgumentException(PasswordResetMessages.MESSAGE_TOKEN_INVALID);
        }

        String email = emailOptional.get();

        User user = userRepositoryPort.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException(PasswordResetMessages.MESSAGE_EMAIL_NOT_FOUND));

        if (user.getStatus() != UserStatusEnum.ACTIVE) {
            throw new IllegalArgumentException(PasswordResetMessages.MESSAGE_USER_NOT_ACTIVE);
        }

        try {
            user.setPassword(passwordEncoder.encode(request.newPassword()));
            userRepositoryPort.save(user);

            passwordResetTokenPort.deleteToken(request.token());

            log.info(PasswordResetLogMessages.LOG_RESET_PASSWORD_SUCCESS, email);
        } catch (Exception e) {
            log.error(PasswordResetLogMessages.LOG_RESET_PASSWORD_ERROR, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public boolean validateToken(String token) {
        log.debug(PasswordResetLogMessages.LOG_VALIDATE_TOKEN_START);
        boolean isValid = passwordResetTokenPort.isTokenValid(token);
        log.debug(PasswordResetLogMessages.LOG_VALIDATE_TOKEN_RESULT, isValid);
        return isValid;
    }

    private String generateResetToken() {
        return UUID.randomUUID().toString().replace("-", "") +
                UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private String generateMobileResetToken() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000); // Tạo số từ 100000 đến 999999
        return String.valueOf(otp);
    }

    private void sendPasswordResetEmail(User user, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailServicePort.sendPasswordResetEmail(user.getEmail(), token, resetLink);
    }

    /** Ghi lịch sử quên mật khẩu tự phục vụ (khách USER) vào bảng audit chung. */
    private void recordForgotPasswordSelfServiceIfCustomer(User user) {
        if (user.getRole() == null || !RoleEnum.USER.name().equals(user.getRole().getName())) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        UUID id = UUID.randomUUID();
        String roleName = user.getRole().getName();
        CredentialReissueHistory row = CredentialReissueHistory.builder()
                .id(id)
                .subjectUser(user)
                .subjectRoleName(roleName)
                .eventType(CredentialReissueEventType.FORGOT_PASSWORD_SELF_SERVICE)
                .status(CredentialReissueStatus.COMPLETED)
                .correlationId(id)
                .createdAt(now)
                .updatedAt(now)
                .build();
        try {
            credentialReissueHistoryPort.save(row);
        } catch (Exception e) {
            log.warn("[PasswordResetService] Không ghi được credential_reissue_history: {}", e.getMessage());
        }
    }
}

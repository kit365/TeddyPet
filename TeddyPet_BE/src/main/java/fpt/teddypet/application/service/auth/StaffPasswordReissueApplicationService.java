package fpt.teddypet.application.service.auth;

import fpt.teddypet.application.constants.auth.StaffPasswordReissueMessages;
import fpt.teddypet.application.dto.response.auth.StaffPasswordReissuePreviewResponse;
import fpt.teddypet.application.dto.response.auth.StaffReissueRequestOutcome;
import fpt.teddypet.application.dto.response.notification.NotificationResponse;
import fpt.teddypet.application.port.input.auth.StaffPasswordReissueService;
import fpt.teddypet.application.port.input.notification.NotificationService;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.application.port.output.auth.CredentialReissueHistoryPort;
import fpt.teddypet.application.port.output.staff.StaffProfileRepositoryPort;
import fpt.teddypet.application.util.SecureTokenHash;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.entity.auth.CredentialReissueHistory;
import fpt.teddypet.domain.entity.staff.StaffProfile;
import fpt.teddypet.domain.enums.RoleEnum;
import fpt.teddypet.domain.enums.UserStatusEnum;
import fpt.teddypet.domain.enums.auth.CredentialReissueEventType;
import fpt.teddypet.domain.enums.auth.CredentialReissueStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StaffPasswordReissueApplicationService implements StaffPasswordReissueService {

    private static final int ADMIN_TOKEN_EXPIRY_HOURS = 48;
    private static final int TEMP_PASSWORD_LENGTH = 14;

    private final UserRepositoryPort userRepositoryPort;
    private final CredentialReissueHistoryPort credentialReissueHistoryPort;
    private final NotificationService notificationService;
    private final EmailServicePort emailServicePort;
    private final StaffProfileRepositoryPort staffProfileRepositoryPort;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.admin-url:${app.frontend-url:http://localhost:5173}}")
    private String adminFrontendUrl;

    @Override
    @Transactional
    public StaffReissueRequestOutcome requestReissue(String usernameOrEmail) {
        String key = usernameOrEmail == null ? "" : usernameOrEmail.trim();
        if (key.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập email hoặc tên đăng nhập.");
        }

        Optional<User> userOpt = userRepositoryPort.findByUsernameOrEmail(key, key);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException(StaffPasswordReissueMessages.MESSAGE_USER_NOT_FOUND);
        }

        User user = userOpt.get();
        String roleName = user.getRole() != null ? user.getRole().getName() : "";
        if (!RoleEnum.STAFF.name().equals(roleName)) {
            throw new IllegalArgumentException(StaffPasswordReissueMessages.MESSAGE_STAFF_ONLY);
        }

        if (user.getStatus() == UserStatusEnum.PENDING_VERIFICATION) {
            throw new IllegalArgumentException(StaffPasswordReissueMessages.MESSAGE_EMAIL_NOT_VERIFIED);
        }
        if (user.getStatus() != UserStatusEnum.ACTIVE) {
            throw new IllegalArgumentException(StaffPasswordReissueMessages.MESSAGE_USER_NOT_ACTIVE);
        }

        LocalDateTime now = LocalDateTime.now();
        Optional<CredentialReissueHistory> pendingOpt =
                credentialReissueHistoryPort.findLatestPendingBySubjectUserId(user.getId());
        if (pendingOpt.isPresent()) {
            CredentialReissueHistory existing = pendingOpt.get();
            if (existing.getExpiresAt() != null && existing.getExpiresAt().isAfter(now)) {
                return StaffReissueRequestOutcome.ALREADY_PENDING;
            }
            existing.setStatus(CredentialReissueStatus.EXPIRED);
            existing.setUpdatedAt(now);
            credentialReissueHistoryPort.save(existing);
        }

        String rawToken = SecureTokenHash.generateOpaqueToken();
        String tokenHash = SecureTokenHash.sha256Hex(rawToken);
        LocalDateTime expiresAt = now.plusHours(ADMIN_TOKEN_EXPIRY_HOURS);
        UUID id = UUID.randomUUID();

        CredentialReissueHistory row = CredentialReissueHistory.builder()
                .id(id)
                .subjectUser(user)
                .subjectRoleName(roleName)
                .eventType(CredentialReissueEventType.STAFF_REISSUE_REQUEST)
                .status(CredentialReissueStatus.PENDING)
                .adminActionTokenHash(tokenHash)
                .expiresAt(expiresAt)
                .correlationId(id)
                .createdAt(now)
                .updatedAt(now)
                .build();
        credentialReissueHistoryPort.save(row);

        String staffLabel = resolveStaffDisplayName(user);
        String pathOnly = "/admin/password-reissue?token=" + rawToken;
        String fullActionUrl = trimTrailingSlash(adminFrontendUrl) + pathOnly;

        for (User admin : listAdminRecipients()) {
            try {
                notificationService.sendToUser(admin.getUsername(),
                        NotificationResponse.builder()
                                .title("Yêu cầu cấp lại mật khẩu nhân viên")
                                .message("Nhân viên " + staffLabel + " (" + user.getEmail() + ") cần cấp lại mật khẩu.")
                                .type("STAFF_PASSWORD_REISSUE")
                                .targetUrl(pathOnly)
                                .build());
            } catch (Exception e) {
                log.warn("Failed to push notification to admin {}: {}", admin.getUsername(), e.getMessage());
            }
            try {
                emailServicePort.sendStaffPasswordReissueRequestToAdmin(
                        admin.getEmail(),
                        admin.getFirstName() != null ? admin.getFirstName() : admin.getUsername(),
                        user.getEmail(),
                        staffLabel,
                        fullActionUrl);
            } catch (Exception e) {
                log.warn("Failed to send reissue email to admin {}: {}", admin.getEmail(), e.getMessage());
            }
        }

        return StaffReissueRequestOutcome.SENT_NEW;
    }

    @Override
    @Transactional(readOnly = true)
    public StaffPasswordReissuePreviewResponse previewForAdmin(String rawToken) {
        CredentialReissueHistory row = loadPendingHistoryOrThrow(rawToken);
        User subject = userRepositoryPort.getById(row.getSubjectUser().getId());
        return buildPreview(subject);
    }

    @Override
    @Transactional
    public void confirmReissue(String rawToken) {
        CredentialReissueHistory row = loadPendingHistoryOrThrow(rawToken);
        User subject = userRepositoryPort.getById(row.getSubjectUser().getId());
        if (!RoleEnum.STAFF.name().equals(subject.getRole().getName())) {
            throw new IllegalStateException(StaffPasswordReissueMessages.MESSAGE_STAFF_ONLY);
        }

        User resolver = requireCurrentUserEntity();
        User resolverManaged = userRepositoryPort.findById(resolver.getId())
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy tài khoản quản trị."));
        String plain = SecureTokenHash.generateTemporaryPassword(TEMP_PASSWORD_LENGTH);
        subject.setPassword(passwordEncoder.encode(plain));
        subject.setMustChangePassword(true);
        userRepositoryPort.save(subject);

        LocalDateTime now = LocalDateTime.now();
        row.setStatus(CredentialReissueStatus.COMPLETED);
        row.setResolvedAt(now);
        row.setResolvedByUser(resolverManaged);
        row.setAdminActionTokenHash(null);
        row.setUpdatedAt(now);
        credentialReissueHistoryPort.save(row);

        String loginUrl = trimTrailingSlash(frontendUrl) + "/admin/auth/login";
        try {
            emailServicePort.sendStaffTemporaryPasswordEmail(subject.getEmail(), plain, loginUrl);
        } catch (Exception e) {
            log.error("Failed to send temporary password email to staff {}: {}", subject.getEmail(), e.getMessage());
            throw new IllegalStateException("Đã cập nhật mật khẩu nhưng gửi email cho nhân viên thất bại. Vui lòng liên hệ kỹ thuật.");
        }
    }

    private CredentialReissueHistory loadPendingHistoryOrThrow(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException(StaffPasswordReissueMessages.MESSAGE_TOKEN_INVALID_OR_EXPIRED);
        }
        String hash = SecureTokenHash.sha256Hex(rawToken.trim());
        CredentialReissueHistory row = credentialReissueHistoryPort.findPendingByTokenHash(hash)
                .orElseThrow(() -> new IllegalArgumentException(StaffPasswordReissueMessages.MESSAGE_TOKEN_INVALID_OR_EXPIRED));
        if (row.getExpiresAt() != null && row.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(StaffPasswordReissueMessages.MESSAGE_TOKEN_INVALID_OR_EXPIRED);
        }
        return row;
    }

    private StaffPasswordReissuePreviewResponse buildPreview(User subject) {
        Optional<StaffProfile> profileOpt = staffProfileRepositoryPort.findByUserId(subject.getId());
        String fullName = profileOpt.map(StaffProfile::getFullName).orElseGet(() -> {
            String fn = subject.getFirstName() != null ? subject.getFirstName() : "";
            String ln = subject.getLastName() != null ? subject.getLastName() : "";
            String combined = (fn + " " + ln).trim();
            return combined.isEmpty() ? subject.getUsername() : combined;
        });
        Long staffId = profileOpt.map(StaffProfile::getId).orElse(null);
        return new StaffPasswordReissuePreviewResponse(
                subject.getEmail(),
                subject.getUsername(),
                fullName,
                staffId);
    }

    private User requireCurrentUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Chưa đăng nhập.");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }
        String name = authentication.getName();
        return userRepositoryPort.getByUsernameOrEmail(name);
    }

    private List<User> listAdminRecipients() {
        Map<String, User> byUsername = new LinkedHashMap<>();
        for (User u : userRepositoryPort.findByRoleName(RoleEnum.ADMIN.name())) {
            byUsername.putIfAbsent(u.getUsername(), u);
        }
        for (User u : userRepositoryPort.findByRoleName(RoleEnum.SUPER_ADMIN.name())) {
            byUsername.putIfAbsent(u.getUsername(), u);
        }
        return new ArrayList<>(byUsername.values());
    }

    private static String resolveStaffDisplayName(User user) {
        String fn = user.getFirstName() != null ? user.getFirstName() : "";
        String ln = user.getLastName() != null ? user.getLastName() : "";
        String combined = (fn + " " + ln).trim();
        return combined.isEmpty() ? user.getUsername() : combined;
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isEmpty()) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}

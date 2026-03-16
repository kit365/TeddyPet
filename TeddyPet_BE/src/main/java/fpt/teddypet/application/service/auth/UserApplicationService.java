package fpt.teddypet.application.service.auth;

import fpt.teddypet.application.constants.auth.AuthConstants;
import fpt.teddypet.application.constants.user.UserLogMessages;
import fpt.teddypet.application.dto.response.user.UserAvatarItemResponse;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.domain.entity.AvatarImage;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.infrastructure.persistence.postgres.repository.AvatarImageRepository;
import fpt.teddypet.domain.enums.RoleEnum;
import fpt.teddypet.domain.enums.UserStatusEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import fpt.teddypet.application.dto.response.UserProfileResponse;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserApplicationService implements UserService {
    private final UserRepositoryPort userRepositoryPort;
    private final AvatarImageRepository avatarImageRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepositoryPort.findByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepositoryPort.existsByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepositoryPort.existsByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public User getByEmail(String email) {
        return userRepositoryPort.getByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public User getByUsername(String username) {
        return userRepositoryPort.getByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public User getByUsernameOrEmail(String usernameOrEmail) {
        return userRepositoryPort.getByUsernameOrEmail(usernameOrEmail);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        return userRepositoryPort.findAll().stream()
                .map(this::toProfileResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public User getById(UUID userId) {
        return userRepositoryPort.getById(userId);
    }

    private UserProfileResponse toProfileResponse(User u) {
        return new UserProfileResponse(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getPhoneNumber(),
                u.getAvatarUrl(),
                u.getAltImage(),
                u.getGender(),
                u.getDateOfBirth(),
                u.getCreatedAt(),
                u.getStatus(),
                u.getRole() != null ? u.getRole().getName() : null,
                u.getMustChangePassword() != null ? u.getMustChangePassword() : false,
                u.getBackupEmail());
    }

    @Override
    @Transactional
    public User save(User user) {
        return userRepositoryPort.save(user);
    }

    @Override
    @Transactional
    public void trackFailedLogin(User user) {
        // Skip for SUPER_ADMIN
        // Skip for SUPER_ADMIN
        boolean isSuperAdmin = RoleEnum.SUPER_ADMIN.name().equals(user.getRole().getName());
        if (isSuperAdmin) {
            return;
        }

        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        user.setLastFailedLoginAt(LocalDateTime.now());

        if (attempts >= AuthConstants.MAX_FAILED_LOGIN_ATTEMPTS) {
            user.setStatus(UserStatusEnum.LOCKED);
            user.setLockedAt(LocalDateTime.now());
            log.warn(UserLogMessages.LOG_USER_LOCKED, user.getUsername());
        }

        userRepositoryPort.save(user);
    }

    @Override
    @Transactional
    public void resetFailedLoginAttempts(User user) {
        if (user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            user.setLastFailedLoginAt(null);
            userRepositoryPort.save(user);
        }
    }

    @Override
    @Transactional
    public void unlockAccount(UUID userId) {
        User user = userRepositoryPort.getById(userId);

        user.setStatus(UserStatusEnum.ACTIVE);
        user.setFailedLoginAttempts(0);
        user.setLockedAt(null);
        userRepositoryPort.save(user);
        log.info(UserLogMessages.LOG_USER_UNLOCKED, user.getUsername());
    }

    @Override
    @Transactional
    public fpt.teddypet.application.dto.response.UserProfileResponse updateProfile(User user,
            fpt.teddypet.application.dto.request.user.UpdateProfileRequest request) {
        log.info("Updating profile for user: {}", user.getUsername());

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhoneNumber(request.phoneNumber());
        user.setDateOfBirth(request.dateOfBirth());
        user.setGender(request.gender());
        user.setBackupEmail(request.optionalEmail());
        if (request.avatarUrl() != null) {
            String trimmedAvatar = request.avatarUrl().isBlank() ? null : request.avatarUrl().trim();
            user.setAvatarUrl(trimmedAvatar);
            // Tự động sinh altImage thân thiện nếu chưa có
            if (trimmedAvatar != null && (user.getAltImage() == null || user.getAltImage().isBlank())) {
                String displayName = (user.getFirstName() != null && !user.getFirstName().isBlank())
                        ? user.getFirstName()
                        : (user.getUsername() != null ? user.getUsername() : "người dùng");
                user.setAltImage("Ảnh đại diện " + displayName);
            }
        }

        User savedUser = userRepositoryPort.save(user);

        if (request.avatarUrl() != null && !request.avatarUrl().isBlank()) {
            AvatarImage avatar = AvatarImage.builder()
                    .imageUrl(request.avatarUrl().trim())
                    .altText(savedUser.getFirstName() != null ? "Avatar " + savedUser.getFirstName() : "User avatar")
                    .category("USER")
                    .user(savedUser)
                    .isPredefined(false)
                    .build();
            avatarImageRepository.save(avatar);
        }

        log.info("Profile updated successfully for user: {}", savedUser.getUsername());

        return new fpt.teddypet.application.dto.response.UserProfileResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getFirstName(),
                savedUser.getLastName(),
                savedUser.getPhoneNumber(),
                savedUser.getAvatarUrl(),
                savedUser.getAltImage(),
                savedUser.getGender(),
                savedUser.getDateOfBirth(),
                savedUser.getCreatedAt(),
                savedUser.getStatus(),
                savedUser.getRole().getName(),
                savedUser.getMustChangePassword() != null ? savedUser.getMustChangePassword() : false,
                savedUser.getBackupEmail());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserAvatarItemResponse> getMyAvatarImages(User user) {
        if (user == null || user.getId() == null) {
            return List.of();
        }
        return avatarImageRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(a -> new UserAvatarItemResponse(a.getId(), a.getImageUrl()))
                .toList();
    }
}
package fpt.teddypet.application.service.auth;
import fpt.teddypet.application.constants.auth.AuthConstants;
import fpt.teddypet.application.constants.user.UserLogMessages;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.domain.entity.User;
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
                u.getStatus(),
                u.getRole() != null ? u.getRole().getName() : null);
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
        boolean isSuperAdmin = "SUPER_ADMIN".equals(user.getRole().getName());
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
}
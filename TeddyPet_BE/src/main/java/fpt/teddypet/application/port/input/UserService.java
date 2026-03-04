package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.response.UserProfileResponse;
import fpt.teddypet.domain.entity.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserService {
    /** Admin: lấy danh sách tất cả user (cho trang Danh sách người dùng). */
    List<UserProfileResponse> getAllUsers();

    User getById(UUID userId);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    User getByEmail(String email);

    User getByUsername(String username);

    User getByUsernameOrEmail(String usernameOrEmail);

    User save(User user);

    void trackFailedLogin(User user);

    void resetFailedLoginAttempts(User user);

    void unlockAccount(UUID userId);

    fpt.teddypet.application.dto.response.UserProfileResponse updateProfile(User user,
            fpt.teddypet.application.dto.request.user.UpdateProfileRequest request);
}

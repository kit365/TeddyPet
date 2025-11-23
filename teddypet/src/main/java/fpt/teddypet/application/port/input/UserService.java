package fpt.teddypet.application.port.input;

import fpt.teddypet.domain.entity.User;

import java.util.Optional;
import java.util.UUID;

public interface UserService {
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
}

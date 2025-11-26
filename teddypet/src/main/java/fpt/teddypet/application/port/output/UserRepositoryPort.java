package fpt.teddypet.application.port.output;

import fpt.teddypet.domain.entity.User;
import java.util.Optional;
import java.util.UUID;

public interface UserRepositoryPort {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    User save(User user);
    Optional<User> findById(UUID id);
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameOrEmail(String username, String email);

    // Methods that throw exception if not found (as requested to move logic to adapter)
    User getByEmail(String email);
    User getByUsername(String username);
    User getByUsernameOrEmail(String usernameOrEmail);
    User getById(UUID id);
}

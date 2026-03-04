package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.constants.auth.AuthMessages;
import fpt.teddypet.application.constants.user.UserLogMessages;
import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.infrastructure.persistence.postgres.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepositoryPort {

    private final UserRepository userRepository;

    @Override
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public Optional<User> findByUsernameOrEmail(String username, String email) {
        return userRepository.findByUsernameOrEmail(username, email);
    }

    @Override
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn(UserLogMessages.LOG_USER_NOT_FOUND_BY_EMAIL, email);
                    return new IllegalArgumentException(AuthMessages.MESSAGE_USER_NOT_FOUND);
                });
    }

    @Override
    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn(UserLogMessages.LOG_USER_NOT_FOUND_BY_USERNAME, username);
                    return new IllegalArgumentException(AuthMessages.MESSAGE_USER_NOT_FOUND);
                });
    }

    @Override
    public User getByUsernameOrEmail(String usernameOrEmail) {
        return userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> {
                    log.warn(UserLogMessages.LOG_USER_NOT_FOUND_BY_USERNAME_OR_EMAIL, usernameOrEmail);
                    return new IllegalArgumentException(AuthMessages.MESSAGE_USER_NOT_FOUND);
                });
    }

    @Override
    public User getById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn(UserLogMessages.LOG_USER_NOT_FOUND_FOR_UNLOCK, id);
                    return new IllegalArgumentException(AuthMessages.MESSAGE_USER_NOT_FOUND);
                });
    }
}

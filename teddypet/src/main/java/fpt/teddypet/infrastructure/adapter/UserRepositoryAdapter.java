package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.domain.entity.User;
import fpt.teddypet.infrastructure.persistence.postgres.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Adapter for User repository operations
 * Implements UserRepositoryPort and delegates to Spring Data JPA repository
 */
@Component
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepositoryPort {

    private final UserRepository userRepository;

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }
}


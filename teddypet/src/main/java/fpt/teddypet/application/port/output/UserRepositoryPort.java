package fpt.teddypet.application.port.output;

import fpt.teddypet.domain.entity.User;

import java.util.Optional;

/**
 * Port for User repository operations
 * This interface defines the contract for user data access
 */
public interface UserRepositoryPort {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    User save(User user);
    
    Optional<User> findById(Long userId);
}


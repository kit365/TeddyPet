package fpt.teddypet.application.port.input;

import fpt.teddypet.domain.entity.User;

import java.util.Optional;

public interface UserService {
    Optional<User> findByEmail(String email);
    User getByEmail(String email);
    boolean existsByEmail(String email);
    User save(User user);
}


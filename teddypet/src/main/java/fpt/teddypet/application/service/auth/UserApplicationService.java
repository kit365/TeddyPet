package fpt.teddypet.application.service.auth;

import fpt.teddypet.application.constants.user.UserMessages;
import fpt.teddypet.application.port.input.UserService;
import fpt.teddypet.application.port.output.UserRepositoryPort;
import fpt.teddypet.domain.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

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
    public User getByEmail(String email) {
        return userRepositoryPort.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        String.format(UserMessages.MESSAGE_USER_NOT_FOUND_BY_EMAIL, email)));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepositoryPort.existsByEmail(email);
    }

    @Override
    @Transactional
    public User save(User user) {
        return userRepositoryPort.save(user);
    }
}


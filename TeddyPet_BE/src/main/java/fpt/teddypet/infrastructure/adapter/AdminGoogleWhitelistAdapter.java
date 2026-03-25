package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.AdminGoogleWhitelistPort;
import fpt.teddypet.domain.entity.AdminGoogleWhitelist;
import fpt.teddypet.infrastructure.persistence.postgres.repository.AdminGoogleWhitelistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AdminGoogleWhitelistAdapter implements AdminGoogleWhitelistPort {

    private final AdminGoogleWhitelistRepository repository;

    @Override
    public Optional<AdminGoogleWhitelist> findByEmail(String email) {
        return repository.findByEmailAndIsActiveTrueAndIsDeletedFalse(email);
    }

    @Override
    public Optional<AdminGoogleWhitelist> findByToken(String token) {
        return repository.findByInvitationTokenAndIsActiveTrueAndIsDeletedFalse(token);
    }

    @Override
    public List<AdminGoogleWhitelist> findAll() {
        return repository.findAll();
    }

    @Override
    public AdminGoogleWhitelist save(AdminGoogleWhitelist whitelist) {
        return repository.save(whitelist);
    }

    @Override
    public void delete(String email) {
        repository.findByEmailAndIsActiveTrueAndIsDeletedFalse(email)
                .ifPresent(item -> {
                    item.setDeleted(true);
                    repository.save(item);
                });
    }
}

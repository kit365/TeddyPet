package fpt.teddypet.infrastructure.adapter.auth;

import fpt.teddypet.application.port.output.auth.CredentialReissueHistoryPort;
import fpt.teddypet.domain.entity.auth.CredentialReissueHistory;
import fpt.teddypet.domain.enums.auth.CredentialReissueStatus;
import fpt.teddypet.infrastructure.persistence.postgres.repository.auth.CredentialReissueHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CredentialReissueHistoryAdapter implements CredentialReissueHistoryPort {

    private final CredentialReissueHistoryRepository repository;

    @Override
    public CredentialReissueHistory save(CredentialReissueHistory entity) {
        return repository.save(entity);
    }

    @Override
    public Optional<CredentialReissueHistory> findLatestPendingBySubjectUserId(UUID subjectUserId) {
        return repository.findTopBySubjectUser_IdAndStatusOrderByCreatedAtDesc(
                subjectUserId, CredentialReissueStatus.PENDING);
    }

    @Override
    public Optional<CredentialReissueHistory> findPendingByTokenHash(String adminActionTokenHash) {
        return repository.findByAdminActionTokenHashAndStatus(
                adminActionTokenHash, CredentialReissueStatus.PENDING);
    }
}

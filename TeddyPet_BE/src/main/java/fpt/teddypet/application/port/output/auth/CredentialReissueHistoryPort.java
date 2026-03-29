package fpt.teddypet.application.port.output.auth;

import fpt.teddypet.domain.entity.auth.CredentialReissueHistory;
import fpt.teddypet.domain.enums.auth.CredentialReissueStatus;

import java.util.Optional;
import java.util.UUID;

public interface CredentialReissueHistoryPort {

    CredentialReissueHistory save(CredentialReissueHistory entity);

    Optional<CredentialReissueHistory> findLatestPendingBySubjectUserId(UUID subjectUserId);

    Optional<CredentialReissueHistory> findPendingByTokenHash(String adminActionTokenHash);
}

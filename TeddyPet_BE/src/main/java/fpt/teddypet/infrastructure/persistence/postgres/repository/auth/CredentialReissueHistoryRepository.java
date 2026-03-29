package fpt.teddypet.infrastructure.persistence.postgres.repository.auth;

import fpt.teddypet.domain.entity.auth.CredentialReissueHistory;
import fpt.teddypet.domain.enums.auth.CredentialReissueStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CredentialReissueHistoryRepository extends JpaRepository<CredentialReissueHistory, UUID> {

    Optional<CredentialReissueHistory> findTopBySubjectUser_IdAndStatusOrderByCreatedAtDesc(
            UUID subjectUserId, CredentialReissueStatus status);

    Optional<CredentialReissueHistory> findByAdminActionTokenHashAndStatus(
            String adminActionTokenHash, CredentialReissueStatus status);
}

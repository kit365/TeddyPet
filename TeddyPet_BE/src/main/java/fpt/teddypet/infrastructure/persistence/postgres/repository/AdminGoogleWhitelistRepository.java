package fpt.teddypet.infrastructure.persistence.postgres.repository;

import fpt.teddypet.domain.entity.AdminGoogleWhitelist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdminGoogleWhitelistRepository extends JpaRepository<AdminGoogleWhitelist, UUID> {
    Optional<AdminGoogleWhitelist> findByEmailAndIsActiveTrueAndIsDeletedFalse(String email);
    Optional<AdminGoogleWhitelist> findByInvitationTokenAndIsActiveTrueAndIsDeletedFalse(String token);
}

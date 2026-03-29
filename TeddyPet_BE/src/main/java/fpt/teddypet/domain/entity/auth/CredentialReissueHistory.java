package fpt.teddypet.domain.entity.auth;

import fpt.teddypet.domain.entity.User;
import fpt.teddypet.domain.enums.auth.CredentialReissueEventType;
import fpt.teddypet.domain.enums.auth.CredentialReissueStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "credential_reissue_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CredentialReissueHistory {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_user_id", nullable = false)
    private User subjectUser;

    @Column(name = "subject_role_name", nullable = false, length = 50)
    private String subjectRoleName;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 64)
    private CredentialReissueEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CredentialReissueStatus status;

    @Column(name = "admin_action_token_hash", length = 128)
    private String adminActionTokenHash;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_user_id")
    private User resolvedByUser;

    @Column(name = "correlation_id", nullable = false, columnDefinition = "uuid")
    private UUID correlationId;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

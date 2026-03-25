package fpt.teddypet.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

@Entity
@Table(name = "admin_google_whitelist")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AdminGoogleWhitelist extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "role", nullable = false)
    private String role;

    @Column(name = "added_by")
    private String addedBy;

    @Column(name = "invitation_token", unique = true)
    private String invitationToken;

    @Column(name = "token_expired_at")
    private java.time.LocalDateTime tokenExpiredAt;

    @Column(name = "status")
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "confirmed_at")
    private java.time.LocalDateTime confirmedAt;
}

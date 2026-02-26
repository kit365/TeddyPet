package fpt.teddypet.application.dto.request.staff;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for provisioning account to an existing StaffProfile.
 * Email is taken from the profile; this DTO provides username, password, role.
 * - Case A (new User): username and password required.
 * - Case B (existing User, customer becoming staff): only roleName required;
 *   username and password optional (update if provided, preserve if null/empty).
 */
public record AccountCreationDTO(
        @Size(max = 50)
        String username,

        @Size(max = 100)
        String password,

        @NotBlank
        String roleName
) {
}

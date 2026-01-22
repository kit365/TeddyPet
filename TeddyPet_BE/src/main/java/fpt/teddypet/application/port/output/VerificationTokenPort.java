package fpt.teddypet.application.port.output;

import java.util.Optional;

/**
 * Port for managing email verification tokens in Redis.
 */
public interface VerificationTokenPort {
    void saveToken(String email, String token);
    Optional<String> findEmailByToken(String token);
    void deleteToken(String token);
    boolean isTokenValid(String token);
}

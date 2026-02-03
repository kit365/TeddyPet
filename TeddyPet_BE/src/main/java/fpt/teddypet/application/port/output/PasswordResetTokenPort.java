package fpt.teddypet.application.port.output;

import java.util.Optional;

public interface PasswordResetTokenPort {

    void saveToken(String email, String token);

    Optional<String> findEmailByToken(String token);

    void deleteToken(String token);

    boolean isTokenValid(String token);

    void deleteAllTokensForEmail(String email);
}

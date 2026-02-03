package fpt.teddypet.application.port.output;

import java.util.Optional;

/**
 * Port for managing email verification tokens in Redis.
 */
public interface VerificationTokenPort {
    void saveToken(String email, String token);

    Optional<String> findEmailByToken(String token);

    Optional<String> findTokenByEmail(String email);

    void deleteToken(String token);

    boolean isTokenValid(String token);

    /**
     * Save resend cooldown for email (2 minutes by default)
     */
    void saveResendCooldown(String email);

    /**
     * Get remaining cooldown seconds for resending verification email
     * 
     * @return remaining seconds, 0 if can resend immediately
     */
    long getResendCooldownSeconds(String email);

    // Guest OTP methods
    void saveGuestOtp(String email, String otp);

    Optional<String> getGuestOtp(String email);

    void deleteGuestOtp(String email);
}

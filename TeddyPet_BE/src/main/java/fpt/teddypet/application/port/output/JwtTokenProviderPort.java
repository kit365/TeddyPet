package fpt.teddypet.application.port.output;

public interface JwtTokenProviderPort {
    String generateToken(String email);

    String extractEmail(String token);

    Boolean validateToken(String token);

    /**
     * Blacklist a token (for logout)
     */
    void blacklistToken(String token);

    /**
     * Check if a token is blacklisted
     */
    boolean isTokenBlacklisted(String token);
}

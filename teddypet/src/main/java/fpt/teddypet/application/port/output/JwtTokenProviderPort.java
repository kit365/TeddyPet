package fpt.teddypet.application.port.output;

/**
 * Port for JWT Token operations
 * This interface defines the contract for token generation and validation
 */
public interface JwtTokenProviderPort {
    
    /**
     * Generate JWT token for a given email
     * @param email user email
     * @return JWT token string
     */
    String generateToken(String email);
    
    /**
     * Extract email from token
     * @param token JWT token
     * @return email extracted from token
     */
    String extractEmail(String token);
    
    /**
     * Validate token
     * @param token JWT token to validate
     * @return true if token is valid, false otherwise
     */
    Boolean validateToken(String token);
}


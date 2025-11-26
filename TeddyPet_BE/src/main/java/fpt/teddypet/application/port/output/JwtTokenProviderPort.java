package fpt.teddypet.application.port.output;
public interface JwtTokenProviderPort {
    String generateToken(String email);
    String extractEmail(String token);
    Boolean validateToken(String token);
}


package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.PasswordResetTokenPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;


@Slf4j
@Component
@RequiredArgsConstructor
public class PasswordResetTokenAdapter implements PasswordResetTokenPort {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String TOKEN_PREFIX = "password_reset:token:";
    private static final String EMAIL_PREFIX = "password_reset:email:";

    @Value("${app.password-reset.token-expiration-minutes:15}")
    private int tokenExpirationMinutes;

    @Override
    public void saveToken(String email, String token) {
        log.info("[PasswordResetTokenAdapter] Saving reset token for email: {}", email);

        deleteAllTokensForEmail(email);
        
        String tokenKey = TOKEN_PREFIX + token;
        String emailKey = EMAIL_PREFIX + email;

        redisTemplate.opsForValue().set(tokenKey, email, tokenExpirationMinutes, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set(emailKey, token, tokenExpirationMinutes, TimeUnit.MINUTES);
        
        log.info("[PasswordResetTokenAdapter] Token saved successfully with TTL: {} minutes", tokenExpirationMinutes);
    }

    @Override
    public Optional<String> findEmailByToken(String token) {
        log.debug("[PasswordResetTokenAdapter] Looking up email for token");
        
        String tokenKey = TOKEN_PREFIX + token;
        Object email = redisTemplate.opsForValue().get(tokenKey);
        
        if (email != null) {
            log.debug("[PasswordResetTokenAdapter] Email found for token");
            return Optional.of(email.toString());
        }
        
        log.debug("[PasswordResetTokenAdapter] No email found for token");
        return Optional.empty();
    }

    @Override
    public void deleteToken(String token) {
        log.info("[PasswordResetTokenAdapter] Deleting token");
        
        String tokenKey = TOKEN_PREFIX + token;

        Object email = redisTemplate.opsForValue().get(tokenKey);
        if (email != null) {
            String emailKey = EMAIL_PREFIX + email.toString();
            redisTemplate.delete(emailKey);
        }
        
        redisTemplate.delete(tokenKey);
        log.info("[PasswordResetTokenAdapter] Token deleted successfully");
    }

    @Override
    public boolean isTokenValid(String token) {
        String tokenKey = TOKEN_PREFIX + token;
        Boolean exists = redisTemplate.hasKey(tokenKey);
        return Boolean.TRUE.equals(exists);
    }

    @Override
    public void deleteAllTokensForEmail(String email) {
        log.info("[PasswordResetTokenAdapter] Deleting all tokens for email: {}", email);
        
        String emailKey = EMAIL_PREFIX + email;
        Object existingToken = redisTemplate.opsForValue().get(emailKey);
        
        if (existingToken != null) {
            String tokenKey = TOKEN_PREFIX + existingToken.toString();
            redisTemplate.delete(tokenKey);
            redisTemplate.delete(emailKey);
            log.info("[PasswordResetTokenAdapter] Existing tokens deleted for email");
        }
    }
}

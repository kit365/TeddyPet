package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.VerificationTokenPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class VerificationTokenAdapter implements VerificationTokenPort {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String TOKEN_PREFIX = "verify:token:";
    private static final String EMAIL_PREFIX = "verify:email:";

    @Value("${app.verification.token-expiration-minutes:1440}") // Default 24 hours
    private int tokenExpirationMinutes;

    @Override
    public void saveToken(String email, String token) {
        log.info("[VerificationTokenAdapter] Saving verification token for email: {}", email);
        
        String tokenKey = TOKEN_PREFIX + token;
        String emailKey = EMAIL_PREFIX + email;
        
        redisTemplate.opsForValue().set(tokenKey, email, tokenExpirationMinutes, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set(emailKey, token, tokenExpirationMinutes, TimeUnit.MINUTES);
    }

    @Override
    public Optional<String> findEmailByToken(String token) {
        String tokenKey = TOKEN_PREFIX + token;
        Object email = redisTemplate.opsForValue().get(tokenKey);
        return Optional.ofNullable(email).map(Object::toString);
    }

    @Override
    public void deleteToken(String token) {
        String tokenKey = TOKEN_PREFIX + token;
        Object email = redisTemplate.opsForValue().get(tokenKey);
        if (email != null) {
            redisTemplate.delete(EMAIL_PREFIX + email.toString());
        }
        redisTemplate.delete(tokenKey);
    }

    @Override
    public boolean isTokenValid(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(TOKEN_PREFIX + token));
    }
}

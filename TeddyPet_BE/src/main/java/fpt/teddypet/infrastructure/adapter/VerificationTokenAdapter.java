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
    private static final String RESEND_COOLDOWN_PREFIX = "verify:cooldown:";

    @Value("${app.verification.token-expiration-minutes:1440}") // Default 24 hours
    private int tokenExpirationMinutes;

    @Value("${app.verification.resend-cooldown-seconds:120}") // Default 2 minutes
    private int resendCooldownSeconds;

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
    public Optional<String> findTokenByEmail(String email) {
        String emailKey = EMAIL_PREFIX + email;
        Object token = redisTemplate.opsForValue().get(emailKey);
        return Optional.ofNullable(token).map(Object::toString);
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

    @Override
    public void saveResendCooldown(String email) {
        String cooldownKey = RESEND_COOLDOWN_PREFIX + email;
        redisTemplate.opsForValue().set(cooldownKey, System.currentTimeMillis(), resendCooldownSeconds,
                TimeUnit.SECONDS);
        log.info("[VerificationTokenAdapter] Saved resend cooldown for email: {}, cooldown: {}s", email,
                resendCooldownSeconds);
    }

    @Override
    public long getResendCooldownSeconds(String email) {
        String cooldownKey = RESEND_COOLDOWN_PREFIX + email;
        Long ttl = redisTemplate.getExpire(cooldownKey, TimeUnit.SECONDS);
        if (ttl == null || ttl < 0) {
            return 0;
        }
        return ttl;
    }

    // Guest OTP Implementation
    private static final String GUEST_OTP_PREFIX = "guest:otp:";
    private static final int OTP_EXPIRATION_MINUTES = 5;

    @Override
    public void saveGuestOtp(String email, String otp) {
        String key = GUEST_OTP_PREFIX + email;
        redisTemplate.opsForValue().set(key, otp, OTP_EXPIRATION_MINUTES, TimeUnit.MINUTES);
        log.info("[VerificationTokenAdapter] Saved OTP for guest email: {}", email);
    }

    @Override
    public Optional<String> getGuestOtp(String email) {
        String key = GUEST_OTP_PREFIX + email;
        Object otp = redisTemplate.opsForValue().get(key);
        return Optional.ofNullable(otp).map(Object::toString);
    }

    @Override
    public void deleteGuestOtp(String email) {
        String key = GUEST_OTP_PREFIX + email;
        redisTemplate.delete(key);
    }
}

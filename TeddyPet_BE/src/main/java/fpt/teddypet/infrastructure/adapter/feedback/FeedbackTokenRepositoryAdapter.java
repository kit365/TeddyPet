package fpt.teddypet.infrastructure.adapter.feedback;

import fpt.teddypet.application.port.output.feedback.FeedbackTokenRepositoryPort;
import fpt.teddypet.domain.entity.FeedbackToken;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class FeedbackTokenRepositoryAdapter implements FeedbackTokenRepositoryPort {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String REDIS_PREFIX_TOKEN = "feedback_token:";
    private static final String REDIS_PREFIX_ORDER = "feedback_order:";

    @Override
    public FeedbackToken save(FeedbackToken token) {
        String tokenKey = REDIS_PREFIX_TOKEN + token.getToken().toString();
        String orderKey = REDIS_PREFIX_ORDER + token.getOrderId().toString();

        Duration duration = Duration.ofMinutes(token.getExpiryMinutes() > 0 ? token.getExpiryMinutes() : 43200);

        redisTemplate.opsForValue().set(tokenKey, token, duration);
        redisTemplate.opsForValue().set(orderKey, token.getToken().toString(), duration);

        return token;
    }

    @Override
    public Optional<FeedbackToken> findByToken(UUID token) {
        String key = REDIS_PREFIX_TOKEN + token.toString();
        FeedbackToken feedbackToken = (FeedbackToken) redisTemplate.opsForValue().get(key);
        return Optional.ofNullable(feedbackToken);
    }

    @Override
    public Optional<FeedbackToken> findByOrderId(UUID orderId) {
        String orderKey = REDIS_PREFIX_ORDER + orderId.toString();
        String tokenStr = (String) redisTemplate.opsForValue().get(orderKey);
        if (tokenStr == null) {
            return Optional.empty();
        }
        return findByToken(UUID.fromString(tokenStr));
    }

    @Override
    public void delete(FeedbackToken token) {
        String tokenKey = REDIS_PREFIX_TOKEN + token.getToken().toString();
        String orderKey = REDIS_PREFIX_ORDER + token.getOrderId().toString();
        redisTemplate.delete(tokenKey);
        redisTemplate.delete(orderKey);
    }
}

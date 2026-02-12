package fpt.teddypet.application.port.output.feedback;

import fpt.teddypet.domain.entity.FeedbackToken;
import java.util.Optional;
import java.util.UUID;

public interface FeedbackTokenRepositoryPort {
    FeedbackToken save(FeedbackToken token);

    Optional<FeedbackToken> findByToken(UUID token);

    Optional<FeedbackToken> findByOrderId(UUID orderId);

    void delete(FeedbackToken token);
}

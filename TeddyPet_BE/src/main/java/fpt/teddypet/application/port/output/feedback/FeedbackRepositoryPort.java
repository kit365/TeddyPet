package fpt.teddypet.application.port.output.feedback;

import fpt.teddypet.domain.entity.Feedback;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FeedbackRepositoryPort {
    Feedback save(Feedback feedback);

    List<Feedback> findAll();

    Optional<Feedback> findById(Long id);

    List<Feedback> findByProductId(Long productId);

    List<Feedback> findByOrderId(UUID orderId);

    List<Feedback> findByUserId(UUID userId);

    Optional<Feedback> findByOrderIdAndProductIdAndVariantId(UUID orderId, Long productId, Long variantId);

    void delete(Feedback feedback);

    boolean existsByOrderIdAndProductIdAndVariantId(UUID orderId, Long productId, Long variantId);
}

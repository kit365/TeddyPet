package fpt.teddypet.infrastructure.persistence.postgres.repository.feedback;

import fpt.teddypet.domain.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByProductId(Long productId);

    List<Feedback> findByOrderId(UUID orderId);

    List<Feedback> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    Optional<Feedback> findByOrderIdAndProductIdAndVariantVariantId(UUID orderId, Long productId,
            Long variantId);

    boolean existsByOrderIdAndProductIdAndVariantVariantId(UUID orderId, Long productId, Long variantId);
}

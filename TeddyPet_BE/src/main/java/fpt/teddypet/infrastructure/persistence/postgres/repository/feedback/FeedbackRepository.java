package fpt.teddypet.infrastructure.persistence.postgres.repository.feedback;

import fpt.teddypet.domain.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findAllByOrderByCreatedAtDesc();

    List<Feedback> findByProductId(Long productId);

    List<Feedback> findByOrderId(UUID orderId);

    List<Feedback> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT f FROM Feedback f WHERE f.orderId = :orderId AND f.product.id = :productId AND " +
            "((:variantId IS NULL AND f.variant IS NULL) OR (f.variant.variantId = :variantId))")
    Optional<Feedback> findByOrderIdAndProductIdAndVariantId(@Param("orderId") UUID orderId,
            @Param("productId") Long productId,
            @Param("variantId") Long variantId);

    @Query("SELECT COUNT(f) > 0 FROM Feedback f WHERE f.orderId = :orderId AND f.product.id = :productId AND " +
            "((:variantId IS NULL AND f.variant IS NULL) OR (f.variant.variantId = :variantId))")
    boolean existsByOrderIdAndProductIdAndVariantId(@Param("orderId") UUID orderId,
            @Param("productId") Long productId,
            @Param("variantId") Long variantId);
}

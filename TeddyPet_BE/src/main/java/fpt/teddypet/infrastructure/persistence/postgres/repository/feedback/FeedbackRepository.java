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

    List<Feedback> findByOrder_Id(UUID orderId);

    List<Feedback> findByUser_IdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT f FROM Feedback f WHERE f.order.id = :orderId AND f.product.id = :productId AND " +
            "((:variantId IS NULL AND f.variant IS NULL) OR (f.variant.id = :variantId))")
    Optional<Feedback> findByOrderIdAndProductIdAndVariantId(@Param("orderId") java.util.UUID orderId,
            @Param("productId") Long productId,
            @Param("variantId") Long variantId);

    @Query("SELECT COUNT(f), AVG(CAST(f.rating AS double)) FROM Feedback f WHERE f.product.id = :productId")
    List<Object[]> findAverageRatingAndCountByProductId(@Param("productId") Long productId);

    @Query("SELECT COUNT(f) > 0 FROM Feedback f WHERE f.order.id = :orderId AND f.product.id = :productId AND " +
            "((:variantId IS NULL AND f.variant IS NULL) OR (f.variant.variantId = :variantId))")
    boolean existsByOrderIdAndProductIdAndVariantId(@Param("orderId") UUID orderId,
            @Param("productId") Long productId,
            @Param("variantId") Long variantId);


    @Query("SELECT AVG(f.rating) FROM Feedback f")
    Double getAverageRating();

    @Query("SELECT f.rating, COUNT(f) FROM Feedback f GROUP BY f.rating")
    List<Object[]> getRatingDistribution();

    @Query(value = "SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count " +
                   "FROM feedbacks GROUP BY month ORDER BY month DESC LIMIT 6", nativeQuery = true)
    List<Object[]> getMonthlyTrends();

    long countByCreatedAtAfter(java.time.LocalDateTime createdAt);
}

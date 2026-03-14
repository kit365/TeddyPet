package fpt.teddypet.infrastructure.persistence.postgres.repository.products;

import fpt.teddypet.domain.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByIdAndIsDeletedFalse(Long ratingId);
    List<Rating> findByProductIdAndIsDeletedFalse(Long productId);
    List<Rating> findByUserIdAndIsDeletedFalse(UUID userId);
    Optional<Rating> findByProductIdAndUserIdAndIsDeletedFalse(Long productId, UUID userId);
    boolean existsByProductIdAndUserIdAndIsDeletedFalse(Long productId, UUID userId);

    @Query("SELECT COALESCE(AVG(r.score), 0) FROM Rating r WHERE r.isDeleted = false")
    Double getAverageScore();

    long countByIsDeletedFalse();
}


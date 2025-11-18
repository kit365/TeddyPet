package fpt.teddypet.infrastructure.persistence.postgres.repository;

import fpt.teddypet.domain.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByIdAndIsDeletedFalse(Long ratingId);
    List<Rating> findByProductIdAndIsDeletedFalse(Long productId);
    List<Rating> findByUserIdAndIsDeletedFalse(Long userId);
    Optional<Rating> findByProductIdAndUserIdAndIsDeletedFalse(Long productId, Long userId);
    boolean existsByProductIdAndUserIdAndIsDeletedFalse(Long productId, Long userId);
}


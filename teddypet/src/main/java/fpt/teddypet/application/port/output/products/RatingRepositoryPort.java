package fpt.teddypet.application.port.output.products;

import fpt.teddypet.domain.entity.Rating;

import java.util.List;
import java.util.Optional;

public interface RatingRepositoryPort {
    Rating save(Rating rating);
    Optional<Rating> findById(Long ratingId);
    List<Rating> findAll();
    Optional<Rating> findByIdAndIsDeletedFalse(Long ratingId);
    List<Rating> findByProductId(Long productId);
    List<Rating> findByUserId(Long userId);
    Optional<Rating> findByProductIdAndUserId(Long productId, Long userId);
    boolean existsByProductIdAndUserId(Long productId, Long userId);
}


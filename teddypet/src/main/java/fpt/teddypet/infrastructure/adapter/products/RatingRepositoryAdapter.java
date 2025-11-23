package fpt.teddypet.infrastructure.adapter.products;

import fpt.teddypet.application.port.output.products.RatingRepositoryPort;
import fpt.teddypet.domain.entity.Rating;
import fpt.teddypet.infrastructure.persistence.postgres.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RatingRepositoryAdapter implements RatingRepositoryPort {

    private final RatingRepository ratingRepository;

    @Override
    public Rating save(Rating rating) {
        return ratingRepository.save(rating);
    }

    @Override
    public Optional<Rating> findById(Long ratingId) {
        return ratingRepository.findByIdAndIsDeletedFalse(ratingId);
    }

    @Override
    public List<Rating> findAll() {
        return ratingRepository.findAll().stream()
                .filter(rating -> !rating.isDeleted())
                .toList();
    }

    @Override
    public Optional<Rating> findByIdAndIsDeletedFalse(Long ratingId) {
        return ratingRepository.findByIdAndIsDeletedFalse(ratingId);
    }

    @Override
    public List<Rating> findByProductId(Long productId) {
        return ratingRepository.findByProductIdAndIsDeletedFalse(productId);
    }

    @Override
    public List<Rating> findByUserId(Long userId) {
        return ratingRepository.findByUserIdAndIsDeletedFalse(userId);
    }

    @Override
    public Optional<Rating> findByProductIdAndUserId(Long productId, Long userId) {
        return ratingRepository.findByProductIdAndUserIdAndIsDeletedFalse(productId, userId);
    }

    @Override
    public boolean existsByProductIdAndUserId(Long productId, Long userId) {
        return ratingRepository.existsByProductIdAndUserIdAndIsDeletedFalse(productId, userId);
    }
}


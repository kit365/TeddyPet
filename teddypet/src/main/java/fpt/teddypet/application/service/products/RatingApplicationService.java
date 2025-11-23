package fpt.teddypet.application.service.products;

import fpt.teddypet.application.constants.products.rating.RatingLogMessages;
import fpt.teddypet.application.constants.products.rating.RatingMessages;
import fpt.teddypet.application.dto.request.products.rating.RatingRequest;
import fpt.teddypet.application.dto.response.product.rating.RatingResponse;
import fpt.teddypet.application.mapper.RatingMapper;
import fpt.teddypet.application.port.input.AuthService;
import fpt.teddypet.application.port.input.products.ProductService;
import fpt.teddypet.application.port.input.products.RatingService;
import fpt.teddypet.application.port.output.products.RatingRepositoryPort;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.domain.entity.Rating;
import fpt.teddypet.domain.entity.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RatingApplicationService implements RatingService {

    private final RatingRepositoryPort ratingRepositoryPort;
    private final ProductService productService;
    private final AuthService authService;
    private final RatingMapper ratingMapper;

    @Override
    @Transactional
    public RatingResponse create(RatingRequest request) {
        User user = authService.getCurrentUser();
        log.info(RatingLogMessages.LOG_RATING_UPSERT_START, request.productId(), user.getId());
        
        // Validate product exists
        Product product = productService.getByIdAndIsDeletedFalse(request.productId());
        
        // Check if user already rated this product
        if (ratingRepositoryPort.existsByProductIdAndUserId(request.productId(), user.getId())) {
            log.warn(RatingLogMessages.LOG_RATING_ALREADY_EXISTS, user.getId(), request.productId());
            throw new IllegalArgumentException(RatingMessages.MESSAGE_RATING_ALREADY_EXISTS);
        }

        Rating rating = Rating.builder().build();
        ratingMapper.updateRatingFromRequest(request, rating);
        rating.setProduct(product);
        rating.setUser(user);
        if (request.isVerifiedPurchase() == null) {
            rating.setIsVerifiedPurchase(false);
        }
        rating.setActive(true);
        rating.setDeleted(false);

        Rating savedRating = ratingRepositoryPort.save(rating);
        log.info(RatingLogMessages.LOG_RATING_UPSERT_SUCCESS, savedRating.getId());
        return ratingMapper.toResponse(savedRating);
    }

    @Override
    @Transactional
    public RatingResponse update(Long ratingId, RatingRequest request) {
        User user = authService.getCurrentUser();
        log.info(RatingLogMessages.LOG_RATING_UPSERT_START, request.productId(), user.getId());
        
        Rating rating = getById(ratingId);
        validateRatingOwnership(rating, user, RatingMessages.MESSAGE_RATING_NO_PERMISSION_UPDATE);
        
        // Validate product exists
        Product product = productService.getByIdAndIsDeletedFalse(request.productId());

        ratingMapper.updateRatingFromRequest(request, rating);
        rating.setProduct(product);
        if (request.isVerifiedPurchase() != null) {
            rating.setIsVerifiedPurchase(request.isVerifiedPurchase());
        }

        Rating savedRating = ratingRepositoryPort.save(rating);
        log.info(RatingLogMessages.LOG_RATING_UPSERT_SUCCESS, savedRating.getId());
        return ratingMapper.toResponse(savedRating);
    }

    @Override
    @Transactional(readOnly = true)
    public RatingResponse getByIdResponse(Long ratingId) {
        log.info(RatingLogMessages.LOG_RATING_GET_BY_ID, ratingId);
        Rating rating = getById(ratingId);
        return ratingMapper.toResponse(rating);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RatingResponse> getAll() {
        List<Rating> ratings = ratingRepositoryPort.findAll();
        log.info(RatingLogMessages.LOG_RATING_GET_ALL, ratings.size());
        return ratings.stream()
                .map(ratingMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RatingResponse> getByProductId(Long productId) {
        List<Rating> ratings = ratingRepositoryPort.findByProductId(productId);
        log.info(RatingLogMessages.LOG_RATING_GET_BY_PRODUCT, productId, ratings.size());
        return ratings.stream()
                .map(ratingMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RatingResponse> getByUserId(Long userId) {
        List<Rating> ratings = ratingRepositoryPort.findByUserId(userId);
        log.info(RatingLogMessages.LOG_RATING_GET_BY_USER, userId, ratings.size());
        return ratings.stream()
                .map(ratingMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long ratingId) {
        User user = authService.getCurrentUser();
        log.info(RatingLogMessages.LOG_RATING_DELETE_START, ratingId);
        
        Rating rating = getById(ratingId);
        validateRatingOwnership(rating, user, RatingMessages.MESSAGE_RATING_NO_PERMISSION_DELETE);
        
        rating.setDeleted(true);
        rating.setActive(false);
        ratingRepositoryPort.save(rating);
        log.info(RatingLogMessages.LOG_RATING_DELETE_SUCCESS, ratingId);
    }

    private Rating getById(Long ratingId) {
        return ratingRepositoryPort.findById(ratingId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(RatingMessages.MESSAGE_RATING_NOT_FOUND_BY_ID, ratingId)));
    }

    private void validateRatingOwnership(Rating rating, User user, String errorMessage) {
        if (!rating.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException(errorMessage);
        }
    }
}


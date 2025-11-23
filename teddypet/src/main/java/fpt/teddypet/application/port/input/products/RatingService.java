package fpt.teddypet.application.port.input.products;

import fpt.teddypet.application.dto.request.products.rating.RatingRequest;
import fpt.teddypet.application.dto.response.product.rating.RatingResponse;

import java.util.List;
import java.util.UUID;

public interface RatingService {
    RatingResponse create(RatingRequest request);
    RatingResponse update(Long ratingId, RatingRequest request);
    RatingResponse getByIdResponse(Long ratingId);
    List<RatingResponse> getAll();
    List<RatingResponse> getByProductId(Long productId);
    List<RatingResponse> getByUserId(UUID userId);
    void delete(Long ratingId);
}


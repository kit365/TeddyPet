package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.RatingRequest;
import fpt.teddypet.application.dto.response.RatingResponse;

import java.util.List;

public interface RatingService {
    RatingResponse create(RatingRequest request);
    RatingResponse update(Long ratingId, RatingRequest request);
    RatingResponse getByIdResponse(Long ratingId);
    List<RatingResponse> getAll();
    List<RatingResponse> getByProductId(Long productId);
    List<RatingResponse> getByUserId(Long userId);
    void delete(Long ratingId);
}


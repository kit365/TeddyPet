package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.ProductAgeRangeRequest;
import fpt.teddypet.application.dto.response.ProductAgeRangeResponse;
import fpt.teddypet.domain.entity.ProductAgeRange;

import java.util.List;

public interface ProductAgeRangeService {
    ProductAgeRangeResponse create(ProductAgeRangeRequest request);
    ProductAgeRangeResponse update(Long ageRangeId, ProductAgeRangeRequest request);
    ProductAgeRangeResponse getByIdResponse(Long ageRangeId);
    ProductAgeRange getById(Long ageRangeId);
    ProductAgeRange findByName(String name);
    List<ProductAgeRangeResponse> getAll();
    void delete(Long ageRangeId);
}


package fpt.teddypet.application.port.input.products;

import fpt.teddypet.application.dto.request.products.agerange.ProductAgeRangeRequest;
import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeResponse;
import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeInfo;
import fpt.teddypet.domain.entity.ProductAgeRange;

import java.util.List;

public interface ProductAgeRangeService {
    void create(ProductAgeRangeRequest request);
    void update(Long ageRangeId, ProductAgeRangeRequest request);
    ProductAgeRangeResponse getByIdResponse(Long ageRangeId);
    List<ProductAgeRange> getAllByIdsAndActiveAndDeleted(List<Long> ageRangeIds, boolean isActive, boolean isDeleted);
    ProductAgeRange getById(Long ageRangeId);
    ProductAgeRange findByName(String name);
    List<ProductAgeRangeResponse> getAll();
    List<ProductAgeRangeResponse> getAll(Boolean isActive, Boolean isDeleted);
    ProductAgeRangeInfo toInfo(ProductAgeRange ageRange);
    List<ProductAgeRangeInfo> toInfos(List<ProductAgeRange> ageRanges);
    List<ProductAgeRangeInfo> toInfos(List<ProductAgeRange> ageRanges, boolean isDeleted);
    List<ProductAgeRangeInfo> toInfos(List<ProductAgeRange> ageRanges, boolean isDeleted, boolean isActive);
    void delete(Long ageRangeId);
    int deleteMany(List<Long> ids);
}


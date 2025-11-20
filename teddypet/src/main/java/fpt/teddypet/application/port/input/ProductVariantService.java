package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.ProductVariantRequest;
import fpt.teddypet.application.dto.request.ProductVariantSaveRequest;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;

import java.util.List;

public interface ProductVariantService {
    ProductVariantResponse upsert(ProductVariantRequest request);
    List<ProductVariantResponse> batchUpsert(List<ProductVariantRequest> requests);
    List<ProductVariantResponse> saveVariants(ProductVariantSaveRequest request);
    ProductVariantResponse getByIdResponse(Long variantId);
    List<ProductVariantResponse> getByProductId(Long productId);
    List<ProductVariantResponse> getByProductId(Long productId, boolean includeDeleted);
    List<ProductVariantResponse> getByProductId(Long productId, boolean includeDeleted, boolean onlyActive);
    void delete(Long variantId);
}


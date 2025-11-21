package fpt.teddypet.application.port.input;
import fpt.teddypet.application.dto.request.product.variant.ProductVariantSaveRequest;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;

import java.util.List;

public interface ProductVariantService {
    List<ProductVariantResponse> saveVariants(ProductVariantSaveRequest request);
    ProductVariantResponse getByIdResponse(Long variantId);
    List<ProductVariantResponse> getByProductId(Long productId);
    List<ProductVariantResponse> getByProductId(Long productId, boolean includeDeleted);
    List<ProductVariantResponse> getByProductId(Long productId, boolean includeDeleted, boolean onlyActive);
    void delete(Long variantId);
}


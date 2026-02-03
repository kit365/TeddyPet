package fpt.teddypet.application.port.input.products;

import fpt.teddypet.application.dto.request.products.variant.ProductVariantSaveRequest;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;
import fpt.teddypet.domain.entity.ProductVariant;

import java.util.List;

public interface ProductVariantService {
    List<ProductVariantResponse> saveVariants(ProductVariantSaveRequest request);

    ProductVariantResponse getByIdResponse(Long variantId);

    ProductVariant getByIdForCart(Long variantId);

    List<ProductVariantResponse> getByProductId(Long productId);

    List<ProductVariantResponse> getByProductId(Long productId, boolean includeDeleted);

    List<ProductVariantResponse> getByProductId(Long productId, boolean includeDeleted, boolean onlyActive);

    void deductStock(Long variantId, int quantity);

    void delete(Long variantId);
}

package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.ProductImageRequest;
import fpt.teddypet.application.dto.request.ProductImageSaveRequest;
import fpt.teddypet.application.dto.response.ProductImageResponse;

import java.util.List;

public interface ProductImageService {
    ProductImageResponse create(ProductImageRequest request);
    ProductImageResponse update(Long imageId, ProductImageRequest request);
    List<ProductImageResponse> saveImages(ProductImageSaveRequest request);
    ProductImageResponse getByIdResponse(Long imageId);
    List<ProductImageResponse> getByProductId(Long productId);
    void delete(Long imageId);
}


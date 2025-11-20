package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.ProductImageRequest;
import fpt.teddypet.application.dto.request.ProductImageSaveRequest;
import fpt.teddypet.application.dto.response.product.image.ProductImageInfo;
import fpt.teddypet.application.dto.response.product.image.ProductImageResponse;
import fpt.teddypet.domain.entity.ProductImage;

import java.util.List;

public interface ProductImageService {
    ProductImageResponse create(ProductImageRequest request);
    ProductImageResponse update(Long imageId, ProductImageRequest request);
    List<ProductImageResponse> saveImages(ProductImageSaveRequest request);
    ProductImageResponse getByIdResponse(Long imageId);
    List<ProductImageResponse> getByProductId(Long productId);
    ProductImageInfo toInfo(ProductImage image);
    ProductImageInfo toInfo(ProductImage image, boolean includeDeleted);
    ProductImageInfo toInfo(ProductImage image, boolean includeDeleted, boolean onlyActive);

    List<ProductImageInfo> toInfos(List<ProductImage> images);
    List<ProductImageInfo> toInfos(List<ProductImage> images, boolean includeDeleted);
    List<ProductImageInfo> toInfos(List<ProductImage> images, boolean includeDeleted, boolean onlyActive);
    void delete(Long imageId);
}


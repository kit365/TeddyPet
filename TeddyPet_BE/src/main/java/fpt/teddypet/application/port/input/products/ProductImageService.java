package fpt.teddypet.application.port.input.products;

import fpt.teddypet.application.dto.request.products.image.ProductImageRequest;
import fpt.teddypet.application.dto.request.products.image.ProductImageSaveRequest;
import fpt.teddypet.application.dto.response.product.image.ProductImageInfo;
import fpt.teddypet.application.dto.response.product.image.ProductImageResponse;
import fpt.teddypet.domain.entity.ProductImage;

import java.util.List;

public interface ProductImageService {
    void create(ProductImageRequest request);
    void update(Long imageId, ProductImageRequest request);
    void saveImages(ProductImageSaveRequest request);
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


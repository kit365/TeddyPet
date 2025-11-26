package fpt.teddypet.application.port.output.products;

import fpt.teddypet.domain.entity.ProductImage;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ProductImageRepositoryPort {
    ProductImage save(ProductImage productImage);
    List<ProductImage> saveAll(List<ProductImage> productImages);
    Optional<ProductImage> findById(Long imageId);
    List<ProductImage> findByProductId(Long productId);
    void delete(ProductImage productImage);
    int softDeleteByIds(Set<Long> imageIds);
}


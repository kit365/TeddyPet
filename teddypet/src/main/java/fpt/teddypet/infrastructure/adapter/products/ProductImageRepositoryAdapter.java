package fpt.teddypet.infrastructure.adapter.products;

import fpt.teddypet.application.port.output.products.ProductImageRepositoryPort;
import fpt.teddypet.domain.entity.ProductImage;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class ProductImageRepositoryAdapter implements ProductImageRepositoryPort {

    private final ProductImageRepository productImageRepository;

    @Override
    public ProductImage save(ProductImage productImage) {
        return productImageRepository.save(productImage);
    }

    @Override
    public List<ProductImage> saveAll(List<ProductImage> productImages) {
        return productImageRepository.saveAll(productImages);
    }

    @Override
    public Optional<ProductImage> findById(Long imageId) {
        return productImageRepository.findByIdAndIsDeletedFalse(imageId);
    }

    @Override
    public List<ProductImage> findByProductId(Long productId) {
        return productImageRepository.findByProductIdAndIsDeletedFalseOrderByDisplayOrderAsc(productId);
    }

    @Override
    public void delete(ProductImage productImage) {
        productImage.setDeleted(true);
        productImage.setActive(false);
        productImageRepository.save(productImage);
    }

    @Override
    public int softDeleteByIds(Set<Long> imageIds) {
        return productImageRepository.softDeleteByIds(imageIds);
    }
}


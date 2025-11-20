package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.ProductVariantRepositoryPort;
import fpt.teddypet.domain.entity.ProductVariant;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class ProductVariantRepositoryAdapter implements ProductVariantRepositoryPort {

    private final ProductVariantRepository productVariantRepository;

    @Override
    public ProductVariant save(ProductVariant productVariant) {
        return productVariantRepository.save(productVariant);
    }

    @Override
    public List<ProductVariant> saveAll(List<ProductVariant> productVariants) {
        return productVariantRepository.saveAll(productVariants);
    }

    @Override
    public Optional<ProductVariant> findById(Long variantId) {
        return productVariantRepository.findByVariantIdAndIsDeletedFalse(variantId);
    }

    @Override
    public List<ProductVariant> findByProductId(Long productId) {
        return productVariantRepository.findByProductIdAndIsDeletedFalse(productId);
    }

    @Override
    public boolean existsBySku(String sku) {
        return productVariantRepository.existsBySkuValueAndIsDeletedFalse(sku);
    }

    @Override
    public boolean existsBySkuAndVariantIdNot(String sku, Long variantId) {
        return productVariantRepository.existsBySkuValueAndVariantIdNotAndIsDeletedFalse(sku, variantId);
    }

    @Override
    public Optional<ProductVariant> findBySkuAndIsDeletedTrue(String sku) {
        return productVariantRepository.findBySkuValueAndIsDeletedTrue(sku);
    }

    @Override
    public int softDeleteByIds(Set<Long> variantIds) {
        return productVariantRepository.softDeleteByIds(variantIds);
    }
}


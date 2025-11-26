package fpt.teddypet.application.port.output.products;

import fpt.teddypet.domain.entity.ProductVariant;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ProductVariantRepositoryPort {
    ProductVariant save(ProductVariant productVariant);
    List<ProductVariant> saveAll(List<ProductVariant> productVariants);
    Optional<ProductVariant> findById(Long variantId);
    List<ProductVariant> findByProductId(Long productId);
    boolean existsBySku(String sku);
    boolean existsBySkuAndVariantIdNot(String sku, Long variantId);
    Optional<ProductVariant> findBySkuAndIsDeletedTrue(String sku);
    int softDeleteByIds(Set<Long> variantIds);
}


package fpt.teddypet.infrastructure.persistence.postgres.repository;

import fpt.teddypet.domain.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    Optional<ProductVariant> findByVariantIdAndIsDeletedFalse(Long variantId);
    List<ProductVariant> findByProductIdAndIsDeletedFalse(Long productId);
    boolean existsBySkuValueAndIsDeletedFalse(String sku);
    boolean existsBySkuValueAndVariantIdNotAndIsDeletedFalse(String sku, Long variantId);
    Optional<ProductVariant> findBySkuValueAndIsDeletedTrue(String sku);
    
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ProductVariant v SET v.isDeleted = true, v.isActive = false WHERE v.variantId IN :variantIds AND v.isDeleted = false")
    int softDeleteByIds(@Param("variantIds") Set<Long> variantIds);
}


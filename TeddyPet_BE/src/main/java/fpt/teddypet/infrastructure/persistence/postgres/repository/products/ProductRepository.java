package fpt.teddypet.infrastructure.persistence.postgres.repository.products;

import fpt.teddypet.domain.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    // Get products by category ID with pagination (JPA derived query)
    Page<Product> findDistinctByCategoriesIdAndIsActiveTrueAndIsDeletedFalse(Long categoryId, Pageable pageable);

    // Get all products by category ID (no pagination, JPA derived query)
    List<Product> findDistinctByCategoriesIdAndIsActiveTrueAndIsDeletedFalse(Long categoryId);

    // Get products by brand ID with pagination (JPA derived query)
    Page<Product> findByBrandIdAndIsActiveTrueAndIsDeletedFalse(Long brandId, Pageable pageable);

    // Get all products by brand ID (no pagination, JPA derived query)
    List<Product> findByBrandIdAndIsActiveTrueAndIsDeletedFalse(Long brandId);

    Optional<Product> findByIdAndIsActiveTrueAndIsDeletedFalse(Long productId);

    Optional<Product> findByIdAndIsDeletedFalse(Long productId);

    Optional<Product> findBySlugAndIsActiveTrueAndIsDeletedFalse(String slug);

    boolean existsBySlug(String slug);

    boolean existsByBarcode(String barcode);

    boolean existsBySku(String sku);

    Optional<Product> findByBarcodeAndIsActiveTrueAndIsDeletedFalse(String barcode);

    Optional<Product> findBySlug(String slug);
}

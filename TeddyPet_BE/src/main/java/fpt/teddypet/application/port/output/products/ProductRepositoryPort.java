package fpt.teddypet.application.port.output.products;

import fpt.teddypet.domain.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

public interface ProductRepositoryPort {
    // Find products by category ID with pagination
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    // Find all products by category ID (no pagination)
    List<Product> findAllByCategoryId(Long categoryId);

    // Find products by brand ID with pagination
    Page<Product> findByBrandId(Long brandId, Pageable pageable);

    // Find all products by brand ID (no pagination)
    List<Product> findAllByBrandId(Long brandId);

    Optional<Product> findByIdAndIsActiveTrueAndIsDeletedFalse(Long productId);

    Optional<Product> findByIdAndIsDeletedFalse(Long productId);

    Optional<Product> findBySlugAndIsActiveTrueAndIsDeletedFalse(String slug);

    boolean existsBySlug(String slug);

    boolean existsByBarcode(String barcode);

    boolean existsBySku(String sku);

    Optional<Product> findByBarcodeAndIsActiveTrueAndIsDeletedFalse(String barcode);

    Product save(Product product);

    List<Product> findAll();

    Page<Product> findAll(Specification<Product> spec, Pageable pageable);
}

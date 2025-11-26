package fpt.teddypet.application.port.output.products;

import fpt.teddypet.domain.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

public interface ProductRepositoryPort {
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


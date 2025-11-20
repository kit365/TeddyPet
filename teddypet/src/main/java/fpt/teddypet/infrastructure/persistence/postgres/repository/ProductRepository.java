package fpt.teddypet.infrastructure.persistence.postgres.repository;

import fpt.teddypet.domain.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Optional<Product> findByIdAndIsActiveTrueAndIsDeletedFalse(Long productId);
    Optional<Product> findByIdAndIsDeletedFalse(Long productId);
    Optional<Product> findBySlugAndIsActiveTrueAndIsDeletedFalse(String slug);
    boolean existsBySlug(String slug);
    boolean existsByBarcode(String barcode);
    Optional<Product> findByBarcodeAndIsActiveTrueAndIsDeletedFalse(String barcode);

    Optional<Product> findBySlug(String slug);
}


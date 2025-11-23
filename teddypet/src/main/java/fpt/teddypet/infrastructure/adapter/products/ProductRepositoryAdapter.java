package fpt.teddypet.infrastructure.adapter.products;

import fpt.teddypet.application.port.output.products.ProductRepositoryPort;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ProductRepositoryAdapter implements ProductRepositoryPort {

    private final ProductRepository productRepository;

    @Override
    public Optional<Product> findByIdAndIsActiveTrueAndIsDeletedFalse(Long productId) {
        return productRepository.findByIdAndIsActiveTrueAndIsDeletedFalse(productId);
    }

    @Override
    public Optional<Product> findByIdAndIsDeletedFalse(Long productId) {
        return productRepository.findByIdAndIsDeletedFalse(productId);
    }

    @Override
    public Optional<Product> findBySlugAndIsActiveTrueAndIsDeletedFalse(String slug) {
        return productRepository.findBySlugAndIsActiveTrueAndIsDeletedFalse(slug);
    }

    @Override
    public boolean existsBySlug(String slug) {
        return productRepository.existsBySlug(slug);
    }

    @Override
    public boolean existsByBarcode(String barcode) {
        return productRepository.existsByBarcode(barcode);
    }
    
    @Override
    public boolean existsBySku(String sku) {
        return productRepository.existsBySku(sku);
    }

    @Override
    public Optional<Product> findByBarcodeAndIsActiveTrueAndIsDeletedFalse(String barcode) {
        return productRepository.findByBarcodeAndIsActiveTrueAndIsDeletedFalse(barcode);
    }

    @Override
    public Product save(Product product) {
        return productRepository.save(product);
    }

    @Override
    public List<Product> findAll() {
        return productRepository.findAll();
    }

    @Override
    public Page<Product> findAll(Specification<Product> spec, Pageable pageable) {
        return productRepository.findAll(spec, pageable);
    }
}


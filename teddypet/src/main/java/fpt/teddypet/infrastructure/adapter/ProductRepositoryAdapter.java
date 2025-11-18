package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.ProductRepositoryPort;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

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
}


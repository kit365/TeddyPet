package fpt.teddypet.application.port.output;

import fpt.teddypet.domain.entity.Product;

import java.util.Optional;

public interface ProductRepositoryPort {
    Optional<Product> findByIdAndIsActiveTrueAndIsDeletedFalse(Long productId);
    Optional<Product> findByIdAndIsDeletedFalse(Long productId);
}


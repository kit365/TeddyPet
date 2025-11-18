package fpt.teddypet.application.port.output;

import fpt.teddypet.domain.entity.ProductAgeRange;

import java.util.List;
import java.util.Optional;

public interface ProductAgeRangeRepositoryPort {
    ProductAgeRange save(ProductAgeRange productAgeRange);
    Optional<ProductAgeRange> findById(Long ageRangeId);
    List<ProductAgeRange> findAll();
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long ageRangeId);
}


package fpt.teddypet.application.port.output;

import fpt.teddypet.domain.entity.ProductAgeRange;

import java.util.List;
import java.util.Optional;

public interface ProductAgeRangeRepositoryPort {
    ProductAgeRange save(ProductAgeRange productAgeRange);
    ProductAgeRange findById(Long ageRangeId);
    Optional<ProductAgeRange> findByName(String name);
    List<ProductAgeRange> findAllByIdInAndIsActiveAndIsDeleted(List<Long> ageRangeIds, boolean isActive, boolean isDeleted);
    List<ProductAgeRange> findAll();
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long ageRangeId);
}


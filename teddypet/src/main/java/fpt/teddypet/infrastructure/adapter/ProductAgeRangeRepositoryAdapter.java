package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.ProductAgeRangeRepositoryPort;
import fpt.teddypet.domain.entity.ProductAgeRange;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductAgeRangeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ProductAgeRangeRepositoryAdapter implements ProductAgeRangeRepositoryPort {

    private final ProductAgeRangeRepository productAgeRangeRepository;

    @Override
    public ProductAgeRange save(ProductAgeRange productAgeRange) {
        return productAgeRangeRepository.save(productAgeRange);
    }

    @Override
    public Optional<ProductAgeRange> findById(Long ageRangeId) {
        return productAgeRangeRepository.findByIdAndIsDeletedFalse(ageRangeId);
    }

    @Override
    public List<ProductAgeRange> findAll() {
        return productAgeRangeRepository.findAll().stream()
                .filter(ageRange -> !ageRange.isDeleted())
                .toList();
    }

    @Override
    public boolean existsByName(String name) {
        return productAgeRangeRepository.existsByName(name);
    }

    @Override
    public boolean existsByNameAndIdNot(String name, Long ageRangeId) {
        return productAgeRangeRepository.findByName(name)
                .filter(ageRange -> !ageRange.getId().equals(ageRangeId) && !ageRange.isDeleted())
                .isPresent();
    }
}


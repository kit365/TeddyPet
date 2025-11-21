package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.constants.productagerange.ProductAgeRangeMessages;
import fpt.teddypet.application.port.output.ProductAgeRangeRepositoryPort;
import fpt.teddypet.domain.entity.ProductAgeRange;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductAgeRangeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
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
    public ProductAgeRange findById(Long ageRangeId) {
        return productAgeRangeRepository.findById(ageRangeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductAgeRangeMessages.MESSAGE_PRODUCT_AGE_RANGE_NOT_FOUND_BY_ID, ageRangeId)));
    }

    @Override
    public Optional<ProductAgeRange> findByName(String name) {
        return productAgeRangeRepository.findByName(name)
                .filter(ageRange -> !ageRange.isDeleted());
    }

    @Override
    public List<ProductAgeRange> findAllByIdInAndIsActiveAndIsDeleted(List<Long> ageRangeIds, boolean isActive, boolean isDeleted) {
        if (ageRangeIds == null || ageRangeIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<ProductAgeRange> ageRanges = productAgeRangeRepository.findAllByIdInAndIsActiveAndIsDeleted(ageRangeIds, isActive, isDeleted);

        checkMissingIds(ageRangeIds, ageRanges);
        return ageRanges;
    }

    @Override
    public List<ProductAgeRange> findAll() {
        return productAgeRangeRepository.findAll();
    }

    @Override
    public boolean existsByName(String name) {
        return productAgeRangeRepository.existsByName(name);
    }

    @Override
    public boolean existsByNameAndIdNot(String name, Long ageRangeId) {
        return productAgeRangeRepository.findByName(name).isPresent();
    }

    private void checkMissingIds(List<Long> requestedIds, List<ProductAgeRange> foundAgeRange) {
        List<Long> distinctIds = requestedIds.stream().distinct().toList();

        if (foundAgeRange.size() != distinctIds.size()) {
            List<Long> foundIds = foundAgeRange.stream().map(ProductAgeRange::getId).toList();
            List<Long> missingIds = distinctIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();

            throw new EntityNotFoundException("Không tìm thấy độ tuổi với ID: " + missingIds);
        }
    }
}


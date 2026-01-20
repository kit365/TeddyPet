package fpt.teddypet.infrastructure.adapter.products;
import fpt.teddypet.application.port.output.products.ProductTagRepositoryPort;
import fpt.teddypet.domain.entity.ProductTag;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductTagRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ProductTagRepositoryAdapter implements ProductTagRepositoryPort {

    private final ProductTagRepository productTagRepository;

    @Override
    public ProductTag save(ProductTag productTag) {
        return productTagRepository.save(productTag);
    }

    @Override
    public Optional<ProductTag> findById(Long tagId) {
        return productTagRepository.findByIdAndIsDeletedFalse(tagId);
    }

    @Override
    public List<ProductTag> findAll() {
        return productTagRepository.findAll().stream()
                .filter(tag -> !tag.isDeleted())
                .toList();
    }

    @Override
    public boolean existsByName(String name) {
        return productTagRepository.existsByName(name);
    }

    @Override
    public boolean existsByNameAndIdNot(String name, Long tagId) {
        return productTagRepository.findByName(name)
                .filter(tag -> !tag.getId().equals(tagId) && !tag.isDeleted())
                .isPresent();
    }

    @Override
    public List<ProductTag> findAllByIdInAndIsActiveAndIsDeleted(List<Long> tagIds, boolean isActive, boolean isDeleted) {
        if (tagIds == null || tagIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<ProductTag> tags = productTagRepository.findAllByIdInAndIsActiveAndIsDeleted(tagIds, isActive, isDeleted);

        checkMissingIds(tagIds, tags);
        return tags;
    }
    private void checkMissingIds(List<Long> requestedIds, List<ProductTag> foundTags) {
        List<Long> distinctIds = requestedIds.stream().distinct().toList();

        if (foundTags.size() != distinctIds.size()) {
            List<Long> foundIds = foundTags.stream().map(ProductTag::getId).toList();
            List<Long> missingIds = distinctIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();

            throw new EntityNotFoundException("Không tìm thấy tag với ID: " + missingIds);
        }
    }

    @Override
    public int softDeleteByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return 0;
        }
        return productTagRepository.softDeleteByIds(ids);
    }
}


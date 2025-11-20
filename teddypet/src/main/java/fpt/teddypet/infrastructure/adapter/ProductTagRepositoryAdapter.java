package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.ProductTagRepositoryPort;
import fpt.teddypet.domain.entity.ProductTag;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

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
}


package fpt.teddypet.infrastructure.adapter.products;

import fpt.teddypet.application.port.output.products.ProductAttributeRepositoryPort;
import fpt.teddypet.domain.entity.ProductAttribute;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductAttributeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ProductAttributeRepositoryAdapter implements ProductAttributeRepositoryPort {

    private final ProductAttributeRepository productAttributeRepository;

    @Override
    public ProductAttribute save(ProductAttribute attribute) {
        return productAttributeRepository.save(attribute);
    }

    @Override
    public List<ProductAttribute> saveAll(List<ProductAttribute> attributes) {
        return productAttributeRepository.saveAll(attributes);
    }

    @Override
    public Optional<ProductAttribute> findById(Long attributeId) {
        return productAttributeRepository.findByAttributeIdAndIsDeletedFalse(attributeId);
    }

    @Override
    public List<ProductAttribute> findAllActive() {
        return productAttributeRepository.findAllByIsDeletedFalseOrderByDisplayOrderAsc();
    }

    @Override
    public Optional<ProductAttribute> findByNameIgnoreCase(String name) {
        return productAttributeRepository.findByNameIgnoreCaseAndIsDeletedFalse(name);
    }

    @Override
    public List<ProductAttribute> findAllByIdsAndActiveAndDeleted(List<Long> ids, boolean active, boolean deleted) {
        return productAttributeRepository.findAllByAttributeIdInAndIsActiveAndIsDeleted(ids, active, deleted);
    }
}


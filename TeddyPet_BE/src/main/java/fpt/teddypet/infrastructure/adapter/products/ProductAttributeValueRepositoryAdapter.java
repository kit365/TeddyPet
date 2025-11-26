package fpt.teddypet.infrastructure.adapter.products;

import fpt.teddypet.application.port.output.products.ProductAttributeValueRepositoryPort;
import fpt.teddypet.domain.entity.ProductAttributeValue;
import fpt.teddypet.infrastructure.persistence.postgres.repository.products.ProductAttributeValueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class ProductAttributeValueRepositoryAdapter implements ProductAttributeValueRepositoryPort {

    private final ProductAttributeValueRepository productAttributeValueRepository;

    @Override
    public ProductAttributeValue save(ProductAttributeValue value) {
        return productAttributeValueRepository.save(value);
    }

    @Override
    public List<ProductAttributeValue> saveAll(List<ProductAttributeValue> values) {
        return productAttributeValueRepository.saveAll(values);
    }

    @Override
    public Optional<ProductAttributeValue> findById(Long valueId) {
        ProductAttributeValue value = productAttributeValueRepository.findByValueIdAndIsDeletedFalse(valueId);
        return Optional.ofNullable(value);
    }

    @Override
    public List<ProductAttributeValue> findByIds(Set<Long> valueIds) {
        return productAttributeValueRepository.findByValueIdInAndIsDeletedFalse(valueIds);
    }

    @Override
    public List<ProductAttributeValue> findByAttributeId(Long attributeId) {
        return productAttributeValueRepository.findByAttribute_AttributeIdAndIsDeletedFalseOrderByDisplayOrderAsc(attributeId);
    }
}



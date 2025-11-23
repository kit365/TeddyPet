package fpt.teddypet.application.port.output.products;

import fpt.teddypet.domain.entity.ProductAttributeValue;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ProductAttributeValueRepositoryPort {
    ProductAttributeValue save(ProductAttributeValue value);
    List<ProductAttributeValue> saveAll(List<ProductAttributeValue> values);
    Optional<ProductAttributeValue> findById(Long valueId);
    List<ProductAttributeValue> findByIds(Set<Long> valueIds);
    List<ProductAttributeValue> findByAttributeId(Long attributeId);
}



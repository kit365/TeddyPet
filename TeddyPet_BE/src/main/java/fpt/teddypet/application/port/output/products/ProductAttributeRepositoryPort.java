package fpt.teddypet.application.port.output.products;

import fpt.teddypet.domain.entity.ProductAttribute;

import java.util.List;
import java.util.Optional;

public interface ProductAttributeRepositoryPort {
    ProductAttribute save(ProductAttribute attribute);
    List<ProductAttribute> saveAll(List<ProductAttribute> attributes);
    Optional<ProductAttribute> findById(Long attributeId);
    List<ProductAttribute> findAllActive();
    Optional<ProductAttribute> findByNameIgnoreCase(String name);
    List<ProductAttribute> findAllByIdsAndActiveAndDeleted(List<Long> ids, boolean active, boolean deleted);
}


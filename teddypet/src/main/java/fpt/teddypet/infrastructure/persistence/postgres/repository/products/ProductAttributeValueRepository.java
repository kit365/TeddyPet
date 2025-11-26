package fpt.teddypet.infrastructure.persistence.postgres.repository.products;

import fpt.teddypet.domain.entity.ProductAttribute;
import fpt.teddypet.domain.entity.ProductAttributeValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ProductAttributeValueRepository extends JpaRepository<ProductAttributeValue, Long> {
    
    ProductAttributeValue findByValueIdAndIsDeletedFalse(Long valueId);
    
    List<ProductAttributeValue> findByValueIdInAndIsDeletedFalse(Set<Long> valueIds);
    
    List<ProductAttributeValue> findByAttribute_AttributeIdAndIsDeletedFalseOrderByDisplayOrderAsc(Long attributeId);

    Optional<ProductAttributeValue> findByAttributeAndValue(ProductAttribute attribute, String value);
}


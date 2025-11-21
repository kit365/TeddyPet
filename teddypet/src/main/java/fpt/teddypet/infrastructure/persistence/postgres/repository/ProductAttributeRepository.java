package fpt.teddypet.infrastructure.persistence.postgres.repository;

import fpt.teddypet.domain.entity.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, Long> {

    Optional<ProductAttribute> findByAttributeIdAndIsDeletedFalse(Long attributeId);

    List<ProductAttribute> findAllByIsDeletedFalseOrderByDisplayOrderAsc();

    Optional<ProductAttribute> findByNameIgnoreCaseAndIsDeletedFalse(String name);

    Optional<ProductAttribute> findByName(String name);

    List<ProductAttribute> findAllByAttributeIdInAndIsActiveAndIsDeleted(List<Long> attributeIds, boolean isActive, boolean isDeleted);
}


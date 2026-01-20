package fpt.teddypet.infrastructure.persistence.postgres.repository.products;

import fpt.teddypet.domain.entity.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, Long> {

    Optional<ProductAttribute> findByAttributeIdAndIsDeletedFalse(Long attributeId);

    List<ProductAttribute> findAllByIsDeletedFalseOrderByDisplayOrderAsc();

    Optional<ProductAttribute> findByNameIgnoreCaseAndIsDeletedFalse(String name);

    Optional<ProductAttribute> findByName(String name);

    List<ProductAttribute> findAllByAttributeIdInAndIsActiveAndIsDeleted(List<Long> attributeIds, boolean isActive, boolean isDeleted);

    @Modifying
    @Query("UPDATE ProductAttribute p SET p.isDeleted = true, p.isActive = false WHERE p.attributeId IN :ids")
    int softDeleteByIds(@Param("ids") List<Long> ids);
}

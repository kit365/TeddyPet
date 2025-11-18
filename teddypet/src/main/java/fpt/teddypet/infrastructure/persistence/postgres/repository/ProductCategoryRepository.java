package fpt.teddypet.infrastructure.persistence.postgres.repository;

import fpt.teddypet.domain.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {
    Optional<ProductCategory> findByName(String name);
    boolean existsByName(String name);
    Optional<ProductCategory> findByIdAndIsDeletedFalse(Long categoryId);
    List<ProductCategory> findByParentIsNullAndIsDeletedFalse(); // Root categories
    List<ProductCategory> findByParentIdAndIsDeletedFalse(Long parentId); // Child categories
    List<ProductCategory> findByParentIsNull(); // Root categories (for backward compatibility)
    List<ProductCategory> findByParentId(Long parentId); // Child categories (for backward compatibility)
}


package fpt.teddypet.infrastructure.persistence.postgres.repository.products;

import fpt.teddypet.domain.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Long> {
    Optional<ProductCategory> findByName(String name);

    Optional<ProductCategory> findByNameIgnoreCase(String name);

    boolean existsByName(String name);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    Optional<ProductCategory> findByIdAndIsDeletedFalse(Long categoryId);

    List<ProductCategory> findByParentIsNullAndIsDeletedFalse(); // Root categories

    List<ProductCategory> findByParentIdAndIsDeletedFalse(Long parentId); // Child categories

    List<ProductCategory> findByParentIsNull(); // Root categories (for backward compatibility)

    List<ProductCategory> findByParentId(Long parentId); // Child categories (for backward compatibility)

    List<ProductCategory> findAllByIdInAndIsActiveAndIsDeleted(List<Long> categoryIds, boolean active, boolean deleted);

    List<ProductCategory> findByChildrenIsEmptyAndIsDeletedFalse();

    @Modifying
    @Query("UPDATE ProductCategory p SET p.isDeleted = true, p.isActive = false WHERE p.id IN :ids")
    int softDeleteByIds(@Param("ids") List<Long> ids);
}

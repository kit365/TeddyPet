package fpt.teddypet.infrastructure.persistence.postgres.repository.products;

import fpt.teddypet.domain.entity.ProductTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductTagRepository extends JpaRepository<ProductTag, Long> {
    Optional<ProductTag> findByName(String name);

    Optional<ProductTag> findByNameIgnoreCase(String name);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    Optional<ProductTag> findBySlug(String slug);

    Optional<ProductTag> findByIdAndIsDeletedFalse(Long tagId);

    @Query("SELECT t FROM ProductTag t LEFT JOIN FETCH t.products WHERE t.isDeleted = false AND t.isActive = true")
    List<ProductTag> findAllActiveWithProducts();

    List<ProductTag> findAllByIdInAndIsActiveAndIsDeleted(List<Long> tagIds, boolean isActive, boolean isDeleted);

    @Modifying
    @Query("UPDATE ProductTag p SET p.isDeleted = true, p.isActive = false WHERE p.id IN :ids")
    int softDeleteByIds(@Param("ids") List<Long> ids);
}

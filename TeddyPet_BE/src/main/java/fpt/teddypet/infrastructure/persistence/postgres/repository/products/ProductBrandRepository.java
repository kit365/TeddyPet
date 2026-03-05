package fpt.teddypet.infrastructure.persistence.postgres.repository.products;

import fpt.teddypet.domain.entity.ProductBrand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductBrandRepository extends JpaRepository<ProductBrand, Long> {
    Optional<ProductBrand> findByName(String name);

    Optional<ProductBrand> findByNameIgnoreCase(String name);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    Optional<ProductBrand> findByIdAndIsActiveAndIsDeleted(Long brandId, boolean isActive, boolean isDeleted);

    @Modifying
    @Query("UPDATE ProductBrand p SET p.isDeleted = true, p.isActive = false WHERE p.id IN :ids")
    int softDeleteByIds(@Param("ids") List<Long> ids);
}

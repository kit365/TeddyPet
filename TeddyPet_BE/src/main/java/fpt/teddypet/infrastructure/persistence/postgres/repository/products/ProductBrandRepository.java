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

    @Query(value = """
            SELECT DISTINCT b.*
            FROM product_brands b
            JOIN products p ON p.product_brand_id = b.id
            JOIN product_product_categories ppc ON ppc.product_id = p.id
            JOIN product_categories c ON c.id = ppc.product_category_id
            WHERE b.is_deleted = FALSE
              AND b.is_active = TRUE
              AND p.is_deleted = FALSE
              AND p.is_active = TRUE
              AND c.is_deleted = FALSE
              AND c.is_active = TRUE
              AND c.category_type = :categoryType
              AND (
                    c.suitable_pet_types IS NULL
                    OR c.suitable_pet_types = ''
                    OR (
                        c.suitable_pet_types IS NOT NULL
                        AND c.suitable_pet_types <> ''
                        AND jsonb_exists(c.suitable_pet_types::jsonb, :petType)
                    )
                  )
            ORDER BY b.name
            """, nativeQuery = true)
    List<ProductBrand> findDistinctActiveBrandsForCategoryTypeAndPetType(
            @Param("categoryType") String categoryType,
            @Param("petType") String petType
    );
}

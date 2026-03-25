package fpt.teddypet.infrastructure.persistence.postgres.repository.products;
import fpt.teddypet.domain.entity.ProductAgeRange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductAgeRangeRepository extends JpaRepository<ProductAgeRange, Long> {
    Optional<ProductAgeRange> findByName(String name);
    boolean existsByName(String name);
    boolean existsByNameAndIdNot(String name, Long id);
    Optional<ProductAgeRange> findByIdAndIsDeletedFalse(Long ageRangeId);

    List<ProductAgeRange> findAllByIdInAndIsActiveAndIsDeleted(List<Long> ageRangeIds, boolean isActive, boolean isDeleted);

    @Modifying
    @Query("UPDATE ProductAgeRange p SET p.isDeleted = true, p.isActive = false WHERE p.id IN :ids")
    int softDeleteByIds(@Param("ids") List<Long> ids);
}

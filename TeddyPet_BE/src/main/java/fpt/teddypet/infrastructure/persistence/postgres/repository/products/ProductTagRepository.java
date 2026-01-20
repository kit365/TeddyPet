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
    boolean existsByName(String name);
    Optional<ProductTag> findByIdAndIsDeletedFalse(Long tagId);

    List<ProductTag> findAllByIdInAndIsActiveAndIsDeleted(List<Long> tagIds, boolean isActive, boolean isDeleted);

    @Modifying
    @Query("UPDATE ProductTag p SET p.isDeleted = true, p.isActive = false WHERE p.id IN :ids")
    int softDeleteByIds(@Param("ids") List<Long> ids);
}

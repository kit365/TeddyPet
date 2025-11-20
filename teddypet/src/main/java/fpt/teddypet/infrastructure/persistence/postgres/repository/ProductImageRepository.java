package fpt.teddypet.infrastructure.persistence.postgres.repository;

import fpt.teddypet.domain.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    Optional<ProductImage> findByIdAndIsDeletedFalse(Long imageId);
    List<ProductImage> findByProductIdAndIsDeletedFalseOrderByDisplayOrderAsc(Long productId);
    
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ProductImage i SET i.isDeleted = true, i.isActive = false WHERE i.id IN :imageIds AND i.isDeleted = false")
    int softDeleteByIds(@Param("imageIds") Set<Long> imageIds);
}


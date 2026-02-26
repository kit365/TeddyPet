package fpt.teddypet.infrastructure.persistence.postgres.repository.services;

import fpt.teddypet.domain.entity.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {

    Optional<ServiceCategory> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    List<ServiceCategory> findByParentIsNullAndIsDeletedFalse();

    List<ServiceCategory> findByParentIdAndIsDeletedFalse(Long parentId);

    List<ServiceCategory> findAllByIdInAndIsActiveAndIsDeleted(List<Long> ids, boolean isActive, boolean isDeleted);

    List<ServiceCategory> findByIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc();
}

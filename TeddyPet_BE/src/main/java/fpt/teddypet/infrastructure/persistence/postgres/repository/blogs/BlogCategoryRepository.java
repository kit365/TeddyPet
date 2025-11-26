package fpt.teddypet.infrastructure.persistence.postgres.repository.blogs;

import fpt.teddypet.domain.entity.BlogCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogCategoryRepository extends JpaRepository<BlogCategory, Long> {
    
    Optional<BlogCategory> findBySlug(String slug);
    
    boolean existsBySlug(String slug);
    
    boolean existsBySlugAndIdNot(String slug, Long id);
    
    List<BlogCategory> findByParentIsNullAndIsDeletedFalse();
    
    List<BlogCategory> findByParentIdAndIsDeletedFalse(Long parentId);
    
    List<BlogCategory> findAllByIdInAndIsActiveAndIsDeleted(List<Long> ids, boolean isActive, boolean isDeleted);
    
    List<BlogCategory> findByIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc();
}

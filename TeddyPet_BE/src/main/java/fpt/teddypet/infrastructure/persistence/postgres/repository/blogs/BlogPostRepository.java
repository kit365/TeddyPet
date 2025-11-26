package fpt.teddypet.infrastructure.persistence.postgres.repository.blogs;

import fpt.teddypet.domain.entity.BlogPost;
import fpt.teddypet.domain.enums.BlogPostStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long>, JpaSpecificationExecutor<BlogPost> {
    
    Optional<BlogPost> findBySlug(String slug);
    
    boolean existsBySlug(String slug);
    
    boolean existsBySlugAndIdNot(String slug, Long id);
    
    Page<BlogPost> findByCategoryIdAndStatusAndIsDeletedFalse(Long categoryId, BlogPostStatusEnum status, Pageable pageable);
    
    Page<BlogPost> findByStatusAndIsDeletedFalse(BlogPostStatusEnum status, Pageable pageable);
    
    List<BlogPost> findByParentIsNullAndIsDeletedFalse();
    
    List<BlogPost> findByParentIdAndIsDeletedFalse(Long parentId);
}

package fpt.teddypet.application.port.output;

import fpt.teddypet.domain.entity.BlogPost;
import fpt.teddypet.domain.enums.BlogPostStatusEnum;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

public interface BlogPostRepositoryPort {
    BlogPost save(BlogPost blogPost);
    
    void saveAll(List<BlogPost> blogPosts);
    
    Optional<BlogPost> findById(Long id);
    
    Optional<BlogPost> findBySlug(String slug);
    
    Page<BlogPost> findAll(Pageable pageable);
    
    Page<BlogPost> findAll(Specification<BlogPost> spec, Pageable pageable);
    
    Page<BlogPost> findByCategory(Long categoryId, Pageable pageable);
    
    Page<BlogPost> findByStatus(BlogPostStatusEnum status, Pageable pageable);
    
    List<BlogPost> findRootPosts();
    
    List<BlogPost> findChildPosts(Long parentId);
    
    boolean existsBySlug(String slug);
    
    boolean existsBySlugAndIdNot(String slug, Long id);
    
    void delete(BlogPost blogPost);
}

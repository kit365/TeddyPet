package fpt.teddypet.application.port.output.blogs;

import fpt.teddypet.domain.entity.BlogCategory;
import java.util.List;
import java.util.Optional;

public interface BlogCategoryRepositoryPort {
    BlogCategory save(BlogCategory blogCategory);
    
    void saveAll(List<BlogCategory> blogCategories);
    
    Optional<BlogCategory> findById(Long id);
    
    Optional<BlogCategory> findBySlug(String slug);
    
    List<BlogCategory> findAll();
    
    List<BlogCategory> findAllActive();
    
    List<BlogCategory> findRootCategories();
    
    List<BlogCategory> findChildCategories(Long parentId);
    
    boolean existsBySlug(String slug);
    
    boolean existsBySlugAndIdNot(String slug, Long id);
    
    List<BlogCategory> findAllByIdInAndIsActiveAndIsDeleted(List<Long> ids, boolean isActive, boolean isDeleted);
    
    void delete(BlogCategory blogCategory);
}

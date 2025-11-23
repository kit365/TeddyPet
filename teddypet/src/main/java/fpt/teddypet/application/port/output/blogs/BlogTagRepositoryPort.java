package fpt.teddypet.application.port.output.blogs;

import fpt.teddypet.domain.entity.BlogTag;
import java.util.List;
import java.util.Optional;

public interface BlogTagRepositoryPort {
    BlogTag save(BlogTag blogTag);
    
    void saveAll(List<BlogTag> blogTags);
    
    Optional<BlogTag> findById(Long id);
    
    Optional<BlogTag> findBySlug(String slug);
    
    Optional<BlogTag> findByName(String name);
    
    List<BlogTag> findAll();
    
    boolean existsBySlug(String slug);
    
    boolean existsBySlugAndIdNot(String slug, Long id);
    
    boolean existsByName(String name);
    
    boolean existsByNameAndIdNot(String name, Long id);
    
    void delete(BlogTag blogTag);
}

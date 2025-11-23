package fpt.teddypet.infrastructure.adapter.blogs;

import fpt.teddypet.application.port.output.blogs.BlogPostRepositoryPort;
import fpt.teddypet.domain.entity.BlogPost;
import fpt.teddypet.domain.enums.BlogPostStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.BlogPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class BlogPostRepositoryAdapter implements BlogPostRepositoryPort {

    private final BlogPostRepository blogPostRepository;

    @Override
    public BlogPost save(BlogPost blogPost) {
        return blogPostRepository.save(blogPost);
    }

    @Override
    public void saveAll(List<BlogPost> blogPosts) {
        blogPostRepository.saveAll(blogPosts);
    }

    @Override
    public Optional<BlogPost> findById(Long id) {
        return blogPostRepository.findById(id);
    }

    @Override
    public Optional<BlogPost> findBySlug(String slug) {
        return blogPostRepository.findBySlug(slug);
    }

    @Override
    public Page<BlogPost> findAll(Pageable pageable) {
        return blogPostRepository.findAll(pageable);
    }

    @Override
    public Page<BlogPost> findAll(Specification<BlogPost> spec, Pageable pageable) {
        return blogPostRepository.findAll(spec, pageable);
    }

    @Override
    public Page<BlogPost> findByCategory(Long categoryId, Pageable pageable) {
        return blogPostRepository.findByCategoryIdAndStatusAndIsDeletedFalse(categoryId, BlogPostStatusEnum.PUBLISHED, pageable);
    }

    @Override
    public Page<BlogPost> findByStatus(BlogPostStatusEnum status, Pageable pageable) {
        return blogPostRepository.findByStatusAndIsDeletedFalse(status, pageable);
    }

    @Override
    public List<BlogPost> findRootPosts() {
        return blogPostRepository.findByParentIsNullAndIsDeletedFalse();
    }

    @Override
    public List<BlogPost> findChildPosts(Long parentId) {
        return blogPostRepository.findByParentIdAndIsDeletedFalse(parentId);
    }

    @Override
    public boolean existsBySlug(String slug) {
        return blogPostRepository.existsBySlug(slug);
    }

    @Override
    public boolean existsBySlugAndIdNot(String slug, Long id) {
        return blogPostRepository.existsBySlugAndIdNot(slug, id);
    }

    @Override
    public void delete(BlogPost blogPost) {
        blogPostRepository.delete(blogPost);
    }
}

package fpt.teddypet.infrastructure.adapter.blogs;

import fpt.teddypet.application.port.output.blogs.BlogCategoryRepositoryPort;
import fpt.teddypet.domain.entity.BlogCategory;
import fpt.teddypet.infrastructure.persistence.postgres.repository.blogs.BlogCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class BlogCategoryRepositoryAdapter implements BlogCategoryRepositoryPort {

    private final BlogCategoryRepository blogCategoryRepository;

    @Override
    public BlogCategory save(BlogCategory blogCategory) {
        return blogCategoryRepository.save(blogCategory);
    }

    @Override
    public void saveAll(List<BlogCategory> blogCategories) {
        blogCategoryRepository.saveAll(blogCategories);
    }

    @Override
    public Optional<BlogCategory> findById(Long id) {
        return blogCategoryRepository.findById(id);
    }

    @Override
    public Optional<BlogCategory> findBySlug(String slug) {
        return blogCategoryRepository.findBySlug(slug);
    }

    @Override
    public List<BlogCategory> findAll() {
        return blogCategoryRepository.findAll();
    }

    @Override
    public List<BlogCategory> findAllActive() {
        return blogCategoryRepository.findByIsActiveTrueAndIsDeletedFalseOrderByDisplayOrderAsc();
    }

    @Override
    public List<BlogCategory> findRootCategories() {
        return blogCategoryRepository.findByParentIsNullAndIsDeletedFalse();
    }

    @Override
    public List<BlogCategory> findChildCategories(Long parentId) {
        return blogCategoryRepository.findByParentIdAndIsDeletedFalse(parentId);
    }

    @Override
    public boolean existsBySlug(String slug) {
        return blogCategoryRepository.existsBySlug(slug);
    }

    @Override
    public boolean existsBySlugAndIdNot(String slug, Long id) {
        return blogCategoryRepository.existsBySlugAndIdNot(slug, id);
    }

    @Override
    public List<BlogCategory> findAllByIdInAndIsActiveAndIsDeleted(List<Long> ids, boolean isActive, boolean isDeleted) {
        return blogCategoryRepository.findAllByIdInAndIsActiveAndIsDeleted(ids, isActive, isDeleted);
    }

    @Override
    public void delete(BlogCategory blogCategory) {
        blogCategoryRepository.delete(blogCategory);
    }
}

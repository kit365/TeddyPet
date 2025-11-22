package fpt.teddypet.application.service.blog;

import fpt.teddypet.application.constants.blogs.blogcategory.BlogCategoryLogMessages;
import fpt.teddypet.application.constants.blogs.blogcategory.BlogCategoryMessages;
import fpt.teddypet.application.dto.request.blog.category.BlogCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryInfo;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryNestedResponse;
import fpt.teddypet.application.dto.response.blog.category.BlogCategoryResponse;
import fpt.teddypet.application.mapper.BlogCategoryMapper;
import fpt.teddypet.application.port.input.BlogCategoryService;
import fpt.teddypet.application.port.output.BlogCategoryRepositoryPort;
import fpt.teddypet.application.util.*;
import fpt.teddypet.domain.entity.BlogCategory;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlogCategoryApplicationService implements BlogCategoryService {

    private final BlogCategoryRepositoryPort blogCategoryRepositoryPort;
    private final BlogCategoryMapper blogCategoryMapper;

    @Override
    @Transactional
    public BlogCategoryResponse upsert(BlogCategoryUpsertRequest request) {
        log.info(BlogCategoryLogMessages.LOG_BLOG_CATEGORY_UPSERT_START, request.name());

        BlogCategory category;
        boolean isNew = request.categoryId() == null;

        if (isNew) {
            category = BlogCategory.builder().build();
            category.setActive(true);
            category.setDeleted(false);
        } else {
            category = getById(request.categoryId());
        }

        // Update basic fields
        blogCategoryMapper.updateCategoryFromRequest(request, category);

        // Generate Slug if new or name changed
        if (isNew || !category.getName().equals(request.name())) {
            String slug = SlugUtil.toSlug(request.name());
            ValidationUtils.ensureUnique(
                    () -> blogCategoryRepositoryPort.existsBySlugAndIdNot(slug, isNew ? -1L : category.getId()),
                    String.format(BlogCategoryMessages.MESSAGE_BLOG_CATEGORY_SLUG_ALREADY_EXISTS, slug)
            );
            category.setSlug(slug);
        }

        // Handle Parent
        if (request.parentId() != null) {
            BlogCategory parent = getById(request.parentId());
            validateNoCircularReference(category, parent);
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        // Handle Display Order
        handleDisplayOrder(category, request.displayOrder(), request.parentId());

        // Handle Alt Image
        if (request.imageUrl() != null && !request.imageUrl().isEmpty()) {
            category.setAltImage(ImageAltUtil.generateAltText(request.name()));
        }

        BlogCategory savedCategory = blogCategoryRepositoryPort.save(category);
        log.info(BlogCategoryLogMessages.LOG_BLOG_CATEGORY_UPSERT_SUCCESS, savedCategory.getId());

        return blogCategoryMapper.toResponse(savedCategory);
    }

    @Override
    public BlogCategoryResponse getCategoryDetail(Long id) {
        return blogCategoryMapper.toResponse(getById(id));
    }

    @Override
    public BlogCategory getById(Long id) {
        return blogCategoryRepositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(BlogCategoryMessages.MESSAGE_BLOG_CATEGORY_NOT_FOUND_BY_ID, id)));
    }

    @Override
    public List<BlogCategoryResponse> getAll() {
        return blogCategoryRepositoryPort.findAllActive().stream()
                .map(blogCategoryMapper::toResponse)
                .toList();
    }

    @Override
    public List<BlogCategoryResponse> getRootCategories() {
        return blogCategoryRepositoryPort.findRootCategories().stream()
                .map(blogCategoryMapper::toResponse)
                .toList();
    }

    @Override
    public List<BlogCategoryNestedResponse> getNestedCategories() {
        List<BlogCategory> rootCategories = blogCategoryRepositoryPort.findRootCategories();
        return blogCategoryMapper.toNestedResponseList(rootCategories);
    }

    @Override
    public List<BlogCategoryResponse> getChildCategories(Long parentId) {
        return blogCategoryRepositoryPort.findChildCategories(parentId).stream()
                .map(blogCategoryMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info(BlogCategoryLogMessages.LOG_BLOG_CATEGORY_DELETE_START, id);
        BlogCategory category = getById(id);
        
        // Soft delete
        category.setDeleted(true);
        category.setActive(false);
        blogCategoryRepositoryPort.save(category);
        
        // Normalize display orders of siblings
        normalizeSiblingsDisplayOrder(category.getParent());
        
        log.info(BlogCategoryLogMessages.LOG_BLOG_CATEGORY_DELETE_SUCCESS, id);
    }

    @Override
    public BlogCategoryInfo toInfo(BlogCategory category) {
        return blogCategoryMapper.toInfo(category);
    }

    @Override
    public List<BlogCategoryInfo> toInfos(List<BlogCategory> categories) {
        return ListUtil.safe(categories).stream()
                .map(blogCategoryMapper::toInfo)
                .toList();
    }

    // --- Helper Methods ---

    private void validateNoCircularReference(BlogCategory category, BlogCategory parent) {
        if (category.getId() == null) return; // New category cannot have circular ref yet
        
        if (category.getId().equals(parent.getId())) {
            throw new IllegalArgumentException(BlogCategoryMessages.MESSAGE_BLOG_CATEGORY_CIRCULAR_REFERENCE);
        }

        BlogCategory current = parent;
        while (current != null) {
            if (current.getId().equals(category.getId())) {
                throw new IllegalArgumentException(BlogCategoryMessages.MESSAGE_BLOG_CATEGORY_CIRCULAR_REFERENCE);
            }
            current = current.getParent();
        }
    }

    private void handleDisplayOrder(BlogCategory category, Integer requestedOrder, Long parentId) {
        List<BlogCategory> siblings;
        if (parentId == null) {
            siblings = blogCategoryRepositoryPort.findRootCategories();
        } else {
            siblings = blogCategoryRepositoryPort.findChildCategories(parentId);
        }

        // Remove current category from siblings list if it exists (for update)
        if (category.getId() != null) {
            siblings.removeIf(c -> c.getId().equals(category.getId()));
        }

        if (requestedOrder != null) {
            category.setDisplayOrder(requestedOrder);
        } else {
            // Auto-increment
            int nextOrder = DisplayOrderUtil.getNextDisplayOrder(siblings, BlogCategory::getDisplayOrder);
            category.setDisplayOrder(nextOrder);
        }
    }

    private void normalizeSiblingsDisplayOrder(BlogCategory parent) {
        List<BlogCategory> siblings;
        if (parent == null) {
            siblings = blogCategoryRepositoryPort.findRootCategories();
        } else {
            siblings = blogCategoryRepositoryPort.findChildCategories(parent.getId());
        }
        
        if (DisplayOrderUtil.hasGaps(siblings, BlogCategory::getDisplayOrder)) {
            DisplayOrderUtil.normalizeDisplayOrders(
                siblings,
                BlogCategory::getDisplayOrder,
                BlogCategory::setDisplayOrder
            );
            blogCategoryRepositoryPort.saveAll(siblings);
        }
    }
}

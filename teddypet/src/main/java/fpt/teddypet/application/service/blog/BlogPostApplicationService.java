package fpt.teddypet.application.service.blog;
import fpt.teddypet.application.constants.blogs.blogpost.BlogPostLogMessages;
import fpt.teddypet.application.constants.blogs.blogpost.BlogPostMessages;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.request.blog.post.BlogPostCreateRequest;
import fpt.teddypet.application.dto.request.blog.post.BlogPostSearchRequest;
import fpt.teddypet.application.dto.request.blog.post.BlogPostUpdateRequest;
import fpt.teddypet.application.dto.response.blog.post.BlogPostListResponse;
import fpt.teddypet.application.dto.response.blog.post.BlogPostResponse;
import fpt.teddypet.application.mapper.BlogPostMapper;
import fpt.teddypet.application.port.input.BlogPostService;
import fpt.teddypet.application.port.output.BlogPostRepositoryPort;
import fpt.teddypet.application.util.ImageAltUtil;
import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.application.util.ValidationUtils;
import fpt.teddypet.infrastructure.persistence.postgres.specification.BlogPostSpecification;
import fpt.teddypet.domain.entity.BlogCategory;
import fpt.teddypet.domain.entity.BlogPost;
import fpt.teddypet.domain.entity.BlogTag;
import fpt.teddypet.domain.enums.BlogPostStatusEnum;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlogPostApplicationService implements BlogPostService {

    private final BlogPostRepositoryPort blogPostRepositoryPort;
    private final BlogCategoryApplicationService blogCategoryApplicationService;
    private final BlogTagApplicationService blogTagApplicationService;
    private final BlogPostMapper blogPostMapper;

    @Override
    @Transactional
    public BlogPostResponse create(BlogPostCreateRequest request) {
        log.info(BlogPostLogMessages.LOG_BLOG_POST_CREATE_START, request.title());

        BlogPost blogPost = BlogPost.builder().build();
        blogPostMapper.updatePostFromCreateRequest(request, blogPost);
        
        // 1. Handle Slug
        String slug = SlugUtil.toSlug(request.title());
        ValidationUtils.ensureUnique(
                () -> blogPostRepositoryPort.existsBySlug(slug),
                String.format(BlogPostMessages.MESSAGE_BLOG_POST_SLUG_ALREADY_EXISTS, slug)
        );
        blogPost.setSlug(slug);

        // 2. Handle Category
        if (request.categoryId() != null) {
            BlogCategory category = blogCategoryApplicationService.getById(request.categoryId());
            blogPost.setCategory(category);
        }

        // 3. Handle Tags
        if (request.tagIds() != null && !request.tagIds().isEmpty()) {
            List<BlogTag> tags = request.tagIds().stream()
                    .map(blogTagApplicationService::getById)
                    .toList();
            blogPost.setTags(new ArrayList<>(tags));
        }

        // 4. Handle Parent (Series)
        if (request.parentId() != null) {
            BlogPost parent = getById(request.parentId());
            blogPost.setParent(parent);
        }

        // 5. Handle Alt Image
        if (StringUtils.hasText(request.featuredImage())) {
            blogPost.setAltImage(ImageAltUtil.generateAltText(request.title()));
        }

        // 6. Set Defaults
        if (blogPost.getStatus() == null) {
            blogPost.setStatus(BlogPostStatusEnum.DRAFT);
        }
        if (blogPost.getDisplayOrder() == null) {
            blogPost.setDisplayOrder(0);
        }
        blogPost.setDeleted(false);
        blogPost.setViewCount(0);

        BlogPost savedPost = blogPostRepositoryPort.save(blogPost);
        log.info(BlogPostLogMessages.LOG_BLOG_POST_CREATE_SUCCESS, savedPost.getId());

        return blogPostMapper.toResponse(savedPost);
    }

    @Transactional
    public BlogPostResponse update(Long id, BlogPostUpdateRequest request) {
        log.info(BlogPostLogMessages.LOG_BLOG_POST_UPDATE_START, id);

        BlogPost blogPost = getById(id);
        blogPostMapper.updatePostFromUpdateRequest(request, blogPost);

        // 1. Handle Slug (only if title changed)
        if (!blogPost.getTitle().equals(request.title())) {
            String slug = SlugUtil.toSlug(request.title());
            ValidationUtils.ensureUnique(
                    () -> blogPostRepositoryPort.existsBySlugAndIdNot(slug, id),
                    String.format(BlogPostMessages.MESSAGE_BLOG_POST_SLUG_ALREADY_EXISTS, slug)
            );
            blogPost.setSlug(slug);
        }

        // 2. Handle Category
        if (request.categoryId() != null) {
            BlogCategory category = blogCategoryApplicationService.getById(request.categoryId());
            blogPost.setCategory(category);
        }

        // 3. Handle Tags
        if (request.tagIds() != null) {
            List<BlogTag> tags = request.tagIds().stream()
                    .map(blogTagApplicationService::getById)
                    .toList();
            blogPost.setTags(new ArrayList<>(tags));
        }

        // 4. Handle Parent
        if (request.parentId() != null) {
            BlogPost parent = getById(request.parentId());
            if (parent.getId().equals(id)) {
                throw new IllegalArgumentException("Cannot set parent to self");
            }
            blogPost.setParent(parent);
        } else {
            blogPost.setParent(null);
        }
        
        // 5. Handle Alt Image
        if (StringUtils.hasText(request.featuredImage())) {
             blogPost.setAltImage(ImageAltUtil.generateAltText(request.title()));
        }

        BlogPost savedPost = blogPostRepositoryPort.save(blogPost);
        log.info(BlogPostLogMessages.LOG_BLOG_POST_UPDATE_SUCCESS, savedPost.getId());

        return blogPostMapper.toResponse(savedPost);
    }

    public BlogPost getById(Long id) {
        return blogPostRepositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(BlogPostMessages.MESSAGE_BLOG_POST_NOT_FOUND_BY_ID, id)));
    }
    
    public BlogPostResponse getPostDetail(Long id) {
        return blogPostMapper.toResponse(getById(id));
    }
    
    public BlogPostResponse getPostBySlug(String slug) {
        BlogPost post = blogPostRepositoryPort.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(BlogPostMessages.MESSAGE_BLOG_POST_NOT_FOUND_BY_SLUG, slug)));
        return blogPostMapper.toResponse(post);
    }

    public PageResponse<BlogPostListResponse> getAllPaged(BlogPostSearchRequest request) {
        Sort sort;

        if (StringUtils.hasText(request.sortKey())) {
            Sort.Direction direction = Sort.Direction.ASC;
            if (StringUtils.hasText(request.sortDirection()) && request.sortDirection().equalsIgnoreCase("DESC")) {
                direction = Sort.Direction.DESC;
            }
            sort = Sort.by(direction, request.sortKey());
        } else {
            sort = Sort.by(Sort.Direction.DESC, "createdAt");
        }

        Pageable pageable = PageRequest.of(request.page(), request.size(), sort);

        List<Specification<BlogPost>> specs = new ArrayList<>();
        
        // 1. Base Specification (Not Deleted)
        specs.add(BlogPostSpecification.buildNotDeletedSpecification());

        // 2. Keyword Search
        if (StringUtils.hasText(request.keyword())) {
            specs.add(BlogPostSpecification.buildKeywordSearchSpecification(request.keyword()));
        }

        // 3. Filters
        specs.add(BlogPostSpecification.buildCategoryFilterSpecification(request.categoryId()));
        specs.add(BlogPostSpecification.buildTagFilterSpecification(request.tagId()));
        specs.add(BlogPostSpecification.buildStatusFilterSpecification(request.status()));
        specs.add(BlogPostSpecification.buildDateRangeFilterSpecification(request.createdAtFrom(), request.createdAtTo()));

        Specification<BlogPost> spec = BlogPostSpecification.combineAll(specs);

        Page<BlogPost> page = blogPostRepositoryPort.findAll(spec, pageable);
        
        return new PageResponse<>(
                page.map(blogPostMapper::toListResponse).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    @Transactional
    public void delete(Long id) {
        log.info(BlogPostLogMessages.LOG_BLOG_POST_DELETE_START, id);
        BlogPost post = getById(id);
        post.setDeleted(true);
        blogPostRepositoryPort.save(post);
        log.info(BlogPostLogMessages.LOG_BLOG_POST_DELETE_SUCCESS, id);
    }
    
    @Transactional
    public void incrementViewCount(Long id) {
        BlogPost post = getById(id);
        post.setViewCount(post.getViewCount() + 1);
        blogPostRepositoryPort.save(post);
    }
}

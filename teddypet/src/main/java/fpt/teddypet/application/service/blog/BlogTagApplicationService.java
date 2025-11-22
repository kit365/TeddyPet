package fpt.teddypet.application.service.blog;

import fpt.teddypet.application.constants.blogs.blogtag.BlogTagLogMessages;
import fpt.teddypet.application.constants.blogs.blogtag.BlogTagMessages;
import fpt.teddypet.application.dto.request.blog.tag.BlogTagUpsertRequest;
import fpt.teddypet.application.dto.response.blog.tag.BlogTagInfo;
import fpt.teddypet.application.dto.response.blog.tag.BlogTagResponse;
import fpt.teddypet.application.mapper.BlogTagMapper;
import fpt.teddypet.application.port.input.BlogTagService;
import fpt.teddypet.application.port.output.BlogTagRepositoryPort;
import fpt.teddypet.application.util.DisplayOrderUtil;
import fpt.teddypet.application.util.ListUtil;
import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.application.util.ValidationUtils;
import fpt.teddypet.domain.entity.BlogTag;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlogTagApplicationService implements BlogTagService {

    private final BlogTagRepositoryPort blogTagRepositoryPort;
    private final BlogTagMapper blogTagMapper;

    @Override
    @Transactional
    public BlogTagResponse upsert(BlogTagUpsertRequest request) {
        log.info(BlogTagLogMessages.LOG_BLOG_TAG_UPSERT_START, request.name());

        BlogTag tag;
        boolean isNew = request.tagId() == null;

        if (isNew) {
            tag = BlogTag.builder().build();
        } else {
            tag = getById(request.tagId());
        }

        // Update basic fields
        blogTagMapper.updateTagFromRequest(request, tag);

        // Generate Slug if new or name changed
        if (isNew || !tag.getName().equals(request.name())) {
            String slug = SlugUtil.toSlug(request.name());
            
            // Validate Name Uniqueness
            ValidationUtils.ensureUnique(
                    () -> blogTagRepositoryPort.existsByNameAndIdNot(request.name(), isNew ? -1L : tag.getId()),
                    String.format(BlogTagMessages.MESSAGE_BLOG_TAG_NAME_ALREADY_EXISTS, request.name())
            );

            // Validate Slug Uniqueness
            ValidationUtils.ensureUnique(
                    () -> blogTagRepositoryPort.existsBySlugAndIdNot(slug, isNew ? -1L : tag.getId()),
                    String.format(BlogTagMessages.MESSAGE_BLOG_TAG_SLUG_ALREADY_EXISTS, slug)
            );
            
            tag.setSlug(slug);
        }

        // Handle Display Order
        if (request.displayOrder() != null) {
            tag.setDisplayOrder(request.displayOrder());
        } else if (isNew) {
            // Auto-increment for new tags if not provided
            List<BlogTag> allTags = blogTagRepositoryPort.findAll();
            int nextOrder = DisplayOrderUtil.getNextDisplayOrder(allTags, BlogTag::getDisplayOrder);
            tag.setDisplayOrder(nextOrder);
        }

        BlogTag savedTag = blogTagRepositoryPort.save(tag);
        log.info(BlogTagLogMessages.LOG_BLOG_TAG_UPSERT_SUCCESS, savedTag.getId());

        return blogTagMapper.toResponse(savedTag);
    }

    @Override
    public BlogTagResponse getTagDetail(Long id) {
        return blogTagMapper.toResponse(getById(id));
    }

    @Override
    public BlogTag getById(Long id) {
        return blogTagRepositoryPort.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(BlogTagMessages.MESSAGE_BLOG_TAG_NOT_FOUND_BY_ID, id)));
    }

    @Override
    public List<BlogTagResponse> getAll() {
        return blogTagRepositoryPort.findAll().stream()
                .map(blogTagMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info(BlogTagLogMessages.LOG_BLOG_TAG_DELETE_START, id);
        BlogTag tag = getById(id);
        blogTagRepositoryPort.delete(tag); // Hard delete or soft delete depending on entity/requirement
        // Assuming hard delete for tags or standard JPA delete
        log.info(BlogTagLogMessages.LOG_BLOG_TAG_DELETE_SUCCESS, id);
    }

    @Override
    public BlogTagInfo toInfo(BlogTag tag) {
        return blogTagMapper.toInfo(tag);
    }

    @Override
    public List<BlogTagInfo> toInfos(List<BlogTag> tags) {
        return ListUtil.safe(tags).stream()
                .map(blogTagMapper::toInfo)
                .toList();
    }
}

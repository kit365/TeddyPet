package fpt.teddypet.application.service.product;

import fpt.teddypet.application.constants.producttag.ProductTagLogMessages;
import fpt.teddypet.application.constants.producttag.ProductTagMessages;
import fpt.teddypet.application.dto.request.product.tag.ProductTagRequest;
import fpt.teddypet.application.dto.response.product.tag.ProductTagResponse;
import fpt.teddypet.application.dto.response.product.tag.ProductTagInfo;
import fpt.teddypet.application.mapper.ProductTagMapper;
import fpt.teddypet.application.port.input.ProductTagService;
import fpt.teddypet.application.port.output.ProductTagRepositoryPort;
import fpt.teddypet.application.util.ListUtil;
import fpt.teddypet.domain.entity.ProductTag;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductTagApplicationService implements ProductTagService {

    private final ProductTagRepositoryPort productTagRepositoryPort;
    private final ProductTagMapper productTagMapper;

    @Override
    @Transactional
    public ProductTagResponse create(ProductTagRequest request) {
        log.info(ProductTagLogMessages.LOG_PRODUCT_TAG_UPSERT_START, request.name());
        // Validate name uniqueness
        validateNameUniqueness(request.name(), null);

        ProductTag tag = ProductTag.builder().build();
        productTagMapper.updateTagFromRequest(request, tag);
        tag.setActive(true);
        tag.setDeleted(false);

        ProductTag savedTag = productTagRepositoryPort.save(tag);
        log.info(ProductTagLogMessages.LOG_PRODUCT_TAG_UPSERT_SUCCESS, savedTag.getId());
        return productTagMapper.toResponse(savedTag);
    }

    @Override
    @Transactional
    public ProductTagResponse update(Long tagId, ProductTagRequest request) {
        log.info(ProductTagLogMessages.LOG_PRODUCT_TAG_UPSERT_START, request.name());
        ProductTag tag = getById(tagId);

        // Validate name uniqueness (skip if same name)
        if (!tag.getName().equals(request.name())) {
            validateNameUniqueness(request.name(), tagId);
        }

        productTagMapper.updateTagFromRequest(request, tag);
        ProductTag savedTag = productTagRepositoryPort.save(tag);
        log.info(ProductTagLogMessages.LOG_PRODUCT_TAG_UPSERT_SUCCESS, savedTag.getId());
        return productTagMapper.toResponse(savedTag);
    }

    @Override
    public ProductTagResponse getByIdResponse(Long tagId) {
        log.info(ProductTagLogMessages.LOG_PRODUCT_TAG_GET_BY_ID, tagId);
        ProductTag tag = getById(tagId);
        return productTagMapper.toResponse(tag);
    }

    @Override
    public ProductTag getById(Long tagId) {
        return productTagRepositoryPort.findById(tagId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductTagMessages.MESSAGE_PRODUCT_TAG_NOT_FOUND_BY_ID, tagId)));
    }

    @Override
    public List<ProductTagResponse> getAll() {
        List<ProductTag> tags = productTagRepositoryPort.findAll();
        log.info(ProductTagLogMessages.LOG_PRODUCT_TAG_GET_ALL, tags.size());
        return tags.stream()
                .map(productTagMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long tagId) {
        log.info(ProductTagLogMessages.LOG_PRODUCT_TAG_DELETE_START, tagId);
        ProductTag tag = getById(tagId);
        tag.setDeleted(true);
        tag.setActive(false);
        productTagRepositoryPort.save(tag);
        log.info(ProductTagLogMessages.LOG_PRODUCT_TAG_DELETE_SUCCESS, tagId);
    }


    private void validateNameUniqueness(String name, Long tagId) {
        boolean nameExists = tagId != null
                ? productTagRepositoryPort.existsByNameAndIdNot(name, tagId)
                : productTagRepositoryPort.existsByName(name);

        if (nameExists) {
            log.warn(ProductTagLogMessages.LOG_PRODUCT_TAG_NAME_VALIDATION_FAILED, name);
            throw new IllegalArgumentException(ProductTagMessages.MESSAGE_PRODUCT_TAG_NAME_ALREADY_EXISTS);
        }
    }
    
    @Override
    public ProductTagInfo toInfo(ProductTag tag) {
        return toInfo(tag, false, true);
    }

    @Override
    public ProductTagInfo toInfo(ProductTag tag, boolean includeDeleted) {
        return toInfo(tag, includeDeleted, false);
    }

    @Override
    public ProductTagInfo toInfo(ProductTag tag, boolean includeDeleted, boolean onlyActive) {
        if (tag == null) {
            return null;
        }
        if (!includeDeleted && tag.isDeleted()) return null;
        if (onlyActive && !tag.isActive()) return null;

        return productTagMapper.toInfo(tag);
    }

    @Override
    public List<ProductTag> getAllByIdsAndActiveAndDeleted(List<Long> tagIds, boolean isActive, boolean isDeleted) {
        return productTagRepositoryPort.findAllByIdInAndIsActiveAndIsDeleted(tagIds, isActive, isDeleted);
    }

    @Override
    public List<ProductTagInfo> toInfos(List<ProductTag> tags) {
        return toInfos(tags, false, true);
    }

    @Override
    public List<ProductTagInfo> toInfos(List<ProductTag> tags, boolean includeDeleted) {
        return toInfos(tags, includeDeleted, false);
    }

    @Override
    public List<ProductTagInfo> toInfos(List<ProductTag> tags, boolean includeDeleted, boolean onlyActive) {
        //sort theo chữ cái, không phân biệt hoa thường
        return ListUtil.safe(tags).stream()
                .filter(tag -> includeDeleted || !tag.isDeleted())
                .filter(tag -> !onlyActive || tag.isActive())
                .sorted(Comparator.comparing(ProductTag::getName, String.CASE_INSENSITIVE_ORDER))
                .map(productTagMapper::toInfo)
                .toList();
    }
}


package fpt.teddypet.application.service.products;

import fpt.teddypet.application.constants.products.productagerange.ProductAgeRangeLogMessages;
import fpt.teddypet.application.constants.products.productagerange.ProductAgeRangeMessages;
import fpt.teddypet.application.dto.request.products.agerange.ProductAgeRangeRequest;
import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeResponse;
import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeInfo;
import fpt.teddypet.application.mapper.products.ProductAgeRangeMapper;
import fpt.teddypet.application.port.input.products.ProductAgeRangeService;
import fpt.teddypet.application.port.output.products.ProductAgeRangeRepositoryPort;
import fpt.teddypet.application.util.ListUtil;
import fpt.teddypet.application.util.ValidationUtils;
import fpt.teddypet.domain.entity.ProductAgeRange;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductAgeRangeApplicationService implements ProductAgeRangeService {

    private final ProductAgeRangeRepositoryPort productAgeRangeRepositoryPort;
    private final ProductAgeRangeMapper productAgeRangeMapper;

    @Override
    @Transactional
    public void create(ProductAgeRangeRequest request) {
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_UPSERT_START, request.name());
        // Validate name uniqueness
        validateNameUniqueness(request.name(), null);

        ProductAgeRange ageRange = ProductAgeRange.builder().build();
        productAgeRangeMapper.updateAgeRangeFromRequest(request, ageRange);
        ageRange.setActive(true);
        ageRange.setDeleted(false);

        ProductAgeRange savedAgeRange = productAgeRangeRepositoryPort.save(ageRange);
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_UPSERT_SUCCESS, savedAgeRange.getId());
    }

    @Override
    @Transactional
    public void update(Long ageRangeId, ProductAgeRangeRequest request) {
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_UPSERT_START, request.name());
        ProductAgeRange ageRange = getById(ageRangeId);

        // Validate name uniqueness (skip if same name)
        if (!ageRange.getName().equals(request.name())) {
            validateNameUniqueness(request.name(), ageRangeId);
        }

        productAgeRangeMapper.updateAgeRangeFromRequest(request, ageRange);
        ProductAgeRange savedAgeRange = productAgeRangeRepositoryPort.save(ageRange);
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_UPSERT_SUCCESS, savedAgeRange.getId());
    }

    @Override
    public ProductAgeRangeResponse getByIdResponse(Long ageRangeId) {
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_GET_BY_ID, ageRangeId);
        ProductAgeRange ageRange = getById(ageRangeId);
        return productAgeRangeMapper.toResponse(ageRange);
    }

    @Override
    public List<ProductAgeRange> getAllByIdsAndActiveAndDeleted(List<Long> ageRangeIds, boolean isActive, boolean isDeleted) {
        return productAgeRangeRepositoryPort.findAllByIdInAndIsActiveAndIsDeleted(ageRangeIds, isActive, isDeleted);
    }

    @Override
    public ProductAgeRange getById(Long ageRangeId) {
       return productAgeRangeRepositoryPort.findById(ageRangeId);
    }

    @Override
    public ProductAgeRange findByName(String name) {
        return productAgeRangeRepositoryPort.findByName(name)
                .orElse(null);
    }

    @Override
    public List<ProductAgeRangeResponse> getAll() {
        return getAll(null, null);
    }

    @Override
    public List<ProductAgeRangeResponse> getAll(Boolean isActive, Boolean isDeleted) {
        List<ProductAgeRange> ageRanges = productAgeRangeRepositoryPort.findAll();
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_GET_ALL, ageRanges.size());
        
        return ageRanges.stream()
                .filter(ar -> isActive == null || ar.isActive() == isActive)
                .filter(ar -> isDeleted == null || ar.isDeleted() == isDeleted)
                .map(productAgeRangeMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long ageRangeId) {
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_DELETE_START, ageRangeId);
        ProductAgeRange ageRange = getById(ageRangeId);
        ageRange.setDeleted(true);
        ageRange.setActive(false);
        productAgeRangeRepositoryPort.save(ageRange);
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_DELETE_SUCCESS, ageRangeId);
    }

    @Override
    @Transactional
    public int deleteMany(List<Long> ids) {
        log.info("Starting bulk delete for {} ProductAgeRanges", ids.size());
        int count = productAgeRangeRepositoryPort.softDeleteByIds(ids);
        log.info("Successfully soft deleted {} ProductAgeRanges", count);
        return count;
    }


    private void validateNameUniqueness(String name, Long ageRangeId) {
        boolean nameExists = ageRangeId != null
                ? productAgeRangeRepositoryPort.existsByNameAndIdNot(name, ageRangeId)
                : productAgeRangeRepositoryPort.existsByName(name);

        if (nameExists) {
            log.warn(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_NAME_VALIDATION_FAILED, name);
        }
        
        ValidationUtils.ensureUnique(
            () -> ageRangeId != null
                ? productAgeRangeRepositoryPort.existsByNameAndIdNot(name, ageRangeId)
                : productAgeRangeRepositoryPort.existsByName(name),
            ProductAgeRangeMessages.MESSAGE_PRODUCT_AGE_RANGE_NAME_ALREADY_EXISTS
        );
    }

    @Override
    public ProductAgeRangeInfo toInfo(ProductAgeRange ageRange) {
        return productAgeRangeMapper.toInfo(ageRange);
    }


    @Override
    public List<ProductAgeRangeInfo> toInfos(List<ProductAgeRange> ageRanges) {
        return toInfos(ageRanges, false,  true);
    }

    @Override
    public List<ProductAgeRangeInfo> toInfos(List<ProductAgeRange> ageRanges, boolean includeDeleted) {
        return toInfos(ageRanges, includeDeleted, false);
    }

    @Override
    public List<ProductAgeRangeInfo> toInfos(List<ProductAgeRange> ageRanges, boolean includeDeleted, boolean onlyActive) {
        return ListUtil.safe(ageRanges).stream()
                .filter(val -> includeDeleted || !val.isDeleted())
                .filter(val -> !onlyActive || val.isActive())
//                .sorted(Comparator.comparing(ProductAgeRange::getDisplayOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(productAgeRangeMapper::toInfo)
                .toList();
    }
}


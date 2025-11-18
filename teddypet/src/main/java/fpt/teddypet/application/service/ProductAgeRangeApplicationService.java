package fpt.teddypet.application.service;

import fpt.teddypet.application.constants.productagerange.ProductAgeRangeLogMessages;
import fpt.teddypet.application.constants.productagerange.ProductAgeRangeMessages;
import fpt.teddypet.application.dto.request.ProductAgeRangeRequest;
import fpt.teddypet.application.dto.response.ProductAgeRangeResponse;
import fpt.teddypet.application.mapper.ProductAgeRangeMapper;
import fpt.teddypet.application.port.input.ProductAgeRangeService;
import fpt.teddypet.application.port.output.ProductAgeRangeRepositoryPort;
import fpt.teddypet.domain.entity.ProductAgeRange;
import jakarta.persistence.EntityNotFoundException;
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
    public ProductAgeRangeResponse create(ProductAgeRangeRequest request) {
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_UPSERT_START, request.name());
        // Validate name uniqueness
        validateNameUniqueness(request.name(), null);

        ProductAgeRange ageRange = ProductAgeRange.builder().build();
        productAgeRangeMapper.updateAgeRangeFromRequest(request, ageRange);
        ageRange.setActive(true);
        ageRange.setDeleted(false);

        ProductAgeRange savedAgeRange = productAgeRangeRepositoryPort.save(ageRange);
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_UPSERT_SUCCESS, savedAgeRange.getId());
        return productAgeRangeMapper.toResponse(savedAgeRange);
    }

    @Override
    @Transactional
    public ProductAgeRangeResponse update(Long ageRangeId, ProductAgeRangeRequest request) {
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_UPSERT_START, request.name());
        ProductAgeRange ageRange = getById(ageRangeId);

        // Validate name uniqueness (skip if same name)
        if (!ageRange.getName().equals(request.name())) {
            validateNameUniqueness(request.name(), ageRangeId);
        }

        productAgeRangeMapper.updateAgeRangeFromRequest(request, ageRange);
        ProductAgeRange savedAgeRange = productAgeRangeRepositoryPort.save(ageRange);
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_UPSERT_SUCCESS, savedAgeRange.getId());
        return productAgeRangeMapper.toResponse(savedAgeRange);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductAgeRangeResponse getByIdResponse(Long ageRangeId) {
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_GET_BY_ID, ageRangeId);
        ProductAgeRange ageRange = getById(ageRangeId);
        return productAgeRangeMapper.toResponse(ageRange);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductAgeRangeResponse> getAll() {
        List<ProductAgeRange> ageRanges = productAgeRangeRepositoryPort.findAll();
        log.info(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_GET_ALL, ageRanges.size());
        return ageRanges.stream()
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

    private ProductAgeRange getById(Long ageRangeId) {
        return productAgeRangeRepositoryPort.findById(ageRangeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductAgeRangeMessages.MESSAGE_PRODUCT_AGE_RANGE_NOT_FOUND_BY_ID, ageRangeId)));
    }

    private void validateNameUniqueness(String name, Long ageRangeId) {
        boolean nameExists = ageRangeId != null
                ? productAgeRangeRepositoryPort.existsByNameAndIdNot(name, ageRangeId)
                : productAgeRangeRepositoryPort.existsByName(name);

        if (nameExists) {
            log.warn(ProductAgeRangeLogMessages.LOG_PRODUCT_AGE_RANGE_NAME_VALIDATION_FAILED, name);
            throw new IllegalArgumentException(ProductAgeRangeMessages.MESSAGE_PRODUCT_AGE_RANGE_NAME_ALREADY_EXISTS);
        }
    }
}


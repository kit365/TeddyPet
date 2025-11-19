package fpt.teddypet.application.service;

import fpt.teddypet.application.constants.productbrand.ProductBrandLogMessages;
import fpt.teddypet.application.constants.productbrand.ProductBrandMessages;
import fpt.teddypet.application.dto.request.ProductBrandRequest;
import fpt.teddypet.application.dto.response.ProductBrandResponse;
import fpt.teddypet.application.mapper.ProductBrandMapper;
import fpt.teddypet.application.port.input.ProductBrandService;
import fpt.teddypet.application.port.output.ProductBrandRepositoryPort;
import fpt.teddypet.application.util.ImageAltUtil;
import fpt.teddypet.domain.entity.ProductBrand;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductBrandApplicationService implements ProductBrandService {

    private final ProductBrandRepositoryPort productBrandRepositoryPort;
    private final ProductBrandMapper productBrandMapper;

    @Override
    @Transactional
    public ProductBrandResponse create(ProductBrandRequest request) {
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_UPSERT_START, request.name());
        // Validate name uniqueness
        validateNameUniqueness(request.name(), null);

        ProductBrand brand = ProductBrand.builder().build();
        productBrandMapper.updateBrandFromRequest(request, brand);
        brand.setAltImage(ImageAltUtil.generateAltText(request.name()));
        brand.setActive(true);
        brand.setDeleted(false);

        ProductBrand savedBrand = productBrandRepositoryPort.save(brand);
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_UPSERT_SUCCESS, savedBrand.getId());
        return productBrandMapper.toResponse(savedBrand);
    }

    @Override
    @Transactional
    public ProductBrandResponse update(Long brandId, ProductBrandRequest request) {
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_UPSERT_START, request.name());
        ProductBrand brand = getById(brandId);

        // Validate name uniqueness (skip if same name)
        if (!brand.getName().equals(request.name())) {
            validateNameUniqueness(request.name(), brandId);
        }

        productBrandMapper.updateBrandFromRequest(request, brand);
        brand.setAltImage(ImageAltUtil.generateAltText(request.name()));
        ProductBrand savedBrand = productBrandRepositoryPort.save(brand);
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_UPSERT_SUCCESS, savedBrand.getId());
        return productBrandMapper.toResponse(savedBrand);
    }

    @Override
    public ProductBrandResponse getByIdResponse(Long brandId) {
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_GET_BY_ID, brandId);
        ProductBrand brand = getById(brandId);
        return productBrandMapper.toResponse(brand);
    }

    @Override
    public ProductBrand getById(Long brandId) {
        return productBrandRepositoryPort.findById(brandId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductBrandMessages.MESSAGE_PRODUCT_BRAND_NOT_FOUND_BY_ID, brandId)));
    }

    @Override
    public List<ProductBrandResponse> getAll() {
        List<ProductBrand> brands = productBrandRepositoryPort.findAll();
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_GET_ALL, brands.size());
        return brands.stream()
                .map(productBrandMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long brandId) {
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_DELETE_START, brandId);
        ProductBrand brand = getById(brandId);
        brand.setDeleted(true);
        brand.setActive(false);
        productBrandRepositoryPort.save(brand);
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_DELETE_SUCCESS, brandId);
    }


    private void validateNameUniqueness(String name, Long brandId) {
        boolean nameExists = brandId != null
                ? productBrandRepositoryPort.existsByNameAndIdNot(name, brandId)
                : productBrandRepositoryPort.existsByName(name);

        if (nameExists) {
            log.warn(ProductBrandLogMessages.LOG_PRODUCT_BRAND_NAME_VALIDATION_FAILED, name);
            throw new IllegalArgumentException(ProductBrandMessages.MESSAGE_PRODUCT_BRAND_NAME_ALREADY_EXISTS);
        }
    }
}


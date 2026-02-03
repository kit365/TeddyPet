package fpt.teddypet.application.service.products;

import fpt.teddypet.application.constants.products.productbrand.ProductBrandLogMessages;
import fpt.teddypet.application.constants.products.productbrand.ProductBrandMessages;
import fpt.teddypet.application.dto.request.products.brand.ProductBrandRequest;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandResponse;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandHomeResponse;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandInfo;
import fpt.teddypet.application.mapper.products.ProductBrandMapper;
import fpt.teddypet.application.port.input.products.ProductBrandService;
import fpt.teddypet.application.port.output.products.ProductBrandRepositoryPort;
import fpt.teddypet.application.util.ImageAltUtil;
import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.application.util.ValidationUtils;
import fpt.teddypet.domain.entity.ProductBrand;
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
    public void create(ProductBrandRequest request) {
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_UPSERT_START, request.name());

        validateNameUniqueness(request.name(), null);

        ProductBrand brand = ProductBrand.builder().build();
        productBrandMapper.updateBrandFromRequest(request, brand);

        // Generate and validate Slug
        String slug = SlugUtil.toSlug(request.name());
        ValidationUtils.ensureUnique(
                () -> productBrandRepositoryPort.existsBySlug(slug),
                "Slug '" + slug + "' đã tồn tại");
        brand.setSlug(slug);
        brand.setAltImage(ImageAltUtil.generateAltText(request.name()));
        brand.setActive(true);
        brand.setDeleted(false);

        ProductBrand savedBrand = productBrandRepositoryPort.save(brand);
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_UPSERT_SUCCESS, savedBrand.getId());
    }

    @Override
    @Transactional
    public void update(Long brandId, ProductBrandRequest request) {
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_UPSERT_START, request.name());
        ProductBrand brand = getById(brandId);

        // Validate name uniqueness (skip if same name)
        if (!brand.getName().equals(request.name())) {
            validateNameUniqueness(request.name(), brandId);
        }

        productBrandMapper.updateBrandFromRequest(request, brand);

        // Generate and validate Slug
        String slug = SlugUtil.toSlug(request.name());
        ValidationUtils.ensureUnique(
                () -> productBrandRepositoryPort.existsBySlugAndIdNot(slug, brandId),
                "Slug '" + slug + "' đã tồn tại");
        brand.setSlug(slug);
        brand.setAltImage(ImageAltUtil.generateAltText(request.name()));
        ProductBrand savedBrand = productBrandRepositoryPort.save(brand);
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_UPSERT_SUCCESS, savedBrand.getId());
    }

    @Override
    public ProductBrandResponse getByIdResponse(Long brandId) {
        log.info(ProductBrandLogMessages.LOG_PRODUCT_BRAND_GET_BY_ID, brandId);
        ProductBrand brand = getById(brandId);
        return productBrandMapper.toResponse(brand);
    }

    @Override
    public ProductBrand getById(Long brandId) {
        return productBrandRepositoryPort.findById(brandId);
    }

    @Override
    public ProductBrand getByIdAndStatusAndDeleted(Long brandId, boolean isActive, boolean isDeleted) {
        return productBrandRepositoryPort.findByIdAndActiveAndDeleted(brandId, isActive, isDeleted);
    }

    @Override
    public ProductBrand getReferenceById(Long brandId) {
        return productBrandRepositoryPort.getReferenceById(brandId);
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

    @Override
    @Transactional
    public int deleteMany(List<Long> ids) {
        log.info("Starting bulk delete for {} ProductBrands", ids.size());
        int count = productBrandRepositoryPort.softDeleteByIds(ids);
        log.info("Successfully soft deleted {} ProductBrands", count);
        return count;
    }

    private void validateNameUniqueness(String name, Long brandId) {
        boolean nameExists = brandId != null
                ? productBrandRepositoryPort.existsByNameAndIdNot(name, brandId)
                : productBrandRepositoryPort.existsByName(name);

        if (nameExists) {
            log.warn(ProductBrandLogMessages.LOG_PRODUCT_BRAND_NAME_VALIDATION_FAILED, name);
        }

        ValidationUtils.ensureUnique(
                () -> brandId != null
                        ? productBrandRepositoryPort.existsByNameAndIdNot(name, brandId)
                        : productBrandRepositoryPort.existsByName(name),
                ProductBrandMessages.MESSAGE_PRODUCT_BRAND_NAME_ALREADY_EXISTS);
    }

    @Override
    public ProductBrandInfo toInfo(ProductBrand brand) {
        return toInfo(brand, false, true);
    }

    @Override
    public ProductBrandInfo toInfo(ProductBrand brand, boolean includeDeleted) {
        return toInfo(brand, includeDeleted, false);
    }

    @Override
    public ProductBrandInfo toInfo(ProductBrand brand, boolean includeDeleted, boolean onlyActive) {

        if (brand == null) {
            return null;
        }

        if (!includeDeleted && brand.isDeleted()) {
            return null;
        }

        if (onlyActive && !brand.isActive()) {
            return null;
        }

        return productBrandMapper.toInfo(brand);
    }

    @Override
    public List<ProductBrandHomeResponse> getAllHomeBrands() {
        List<ProductBrand> brands = productBrandRepositoryPort.findAll();
        log.info("Getting home brands, found: {}", brands.size());
        return brands.stream()
                .filter(b -> b.isActive() && !b.isDeleted())
                .map(productBrandMapper::toHomeResponse)
                .toList();
    }
}

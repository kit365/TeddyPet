package fpt.teddypet.application.service;

import fpt.teddypet.application.constants.product.ProductLogMessages;
import fpt.teddypet.application.constants.product.ProductMessages;
import fpt.teddypet.application.dto.request.product.ProductRequest;
import fpt.teddypet.application.dto.request.product.ProductSearchRequest;
import fpt.teddypet.application.dto.request.product.ProductSortField;
import fpt.teddypet.application.dto.common.SortDirection;
import fpt.teddypet.application.dto.response.PageResponse;
import fpt.teddypet.application.dto.response.product.ProductResponse;
import fpt.teddypet.application.mapper.ProductMapper;
import fpt.teddypet.application.port.input.ProductAgeRangeService;
import fpt.teddypet.application.port.input.ProductBrandService;
import fpt.teddypet.application.port.input.ProductCategoryService;
import fpt.teddypet.application.port.input.ProductService;
import fpt.teddypet.application.port.input.ProductTagService;
import fpt.teddypet.application.port.output.ProductRepositoryPort;
import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.domain.entity.ProductAgeRange;
import fpt.teddypet.domain.entity.ProductBrand;
import fpt.teddypet.domain.entity.ProductCategory;
import fpt.teddypet.domain.entity.ProductTag;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.specification.ProductSpecification;
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
import java.util.ArrayList;
import java.util.List;


@Slf4j
@Service
@RequiredArgsConstructor
public class ProductApplicationService implements ProductService {

    private final ProductRepositoryPort productRepositoryPort;
    private final ProductMapper productMapper;
    private final ProductBrandService productBrandService;
    private final ProductCategoryService productCategoryService;
    private final ProductTagService productTagService;
    private final ProductAgeRangeService productAgeRangeService;

    @Override
    public Product getById(Long productId) {
        return productRepositoryPort.findByIdAndIsActiveTrueAndIsDeletedFalse(productId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductMessages.MESSAGE_PRODUCT_NOT_FOUND_BY_ID, productId)));
    }

    @Override
    public Product getByIdAndIsDeletedFalse(Long productId) {
        return productRepositoryPort.findByIdAndIsDeletedFalse(productId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductMessages.MESSAGE_PRODUCT_NOT_FOUND_BY_ID, productId)));
    }

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request) {
        log.info(ProductLogMessages.LOG_PRODUCT_UPSERT_START, request.name());

        // Generate slug from name
        String slug = SlugUtil.toSlug(request.name());
        validateSlugUniqueness(slug, null);

        Product product = Product.builder().build();
        productMapper.updateProductFromRequest(request, product);
        product.setSlug(slug);
        
        // Set barcode if provided
        if (request.barcode() != null && !request.barcode().trim().isEmpty()) {
            validateBarcodeUniqueness(request.barcode(), null);
            product.setBarcode(request.barcode().trim());
        }

        // Set default values
        if (request.status() == null) {
            product.setStatus(ProductStatusEnum.IN_STOCK);
        }
        if (product.getViewCount() == null) {
            product.setViewCount(0);
        }
        if (product.getSoldCount() == null) {
            product.setSoldCount(0);
        }
        // ProductRequest ensures petTypes is never null
        if (request.petTypes().isEmpty()) {
            product.setPetTypes(new ArrayList<>());
        }

        // Set relationships
        setProductRelationships(product, request);

        product.setActive(true);
        product.setDeleted(false);

        Product savedProduct = productRepositoryPort.save(product);
        log.info(ProductLogMessages.LOG_PRODUCT_UPSERT_SUCCESS, savedProduct.getId());
        return productMapper.toResponse(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponse update(Long productId, ProductRequest request) {
        log.info(ProductLogMessages.LOG_PRODUCT_UPSERT_START, request.name());

        Product product = getByIdAndIsDeletedFalse(productId);

        // Check if slug needs to be updated
        String newSlug = SlugUtil.toSlug(request.name());
        if (!product.getSlug().equals(newSlug)) {
            validateSlugUniqueness(newSlug, productId);
            product.setSlug(newSlug);
        }

        productMapper.updateProductFromRequest(request, product);
        
        // Set barcode if provided
        if (request.barcode() != null && !request.barcode().trim().isEmpty()) {
            if (!request.barcode().trim().equals(product.getBarcode())) {
                validateBarcodeUniqueness(request.barcode().trim(), productId);
            }
            product.setBarcode(request.barcode().trim());
        } else {
            product.setBarcode(null);
        }

        // Set relationships
        setProductRelationships(product, request);

        Product savedProduct = productRepositoryPort.save(product);
        log.info(ProductLogMessages.LOG_PRODUCT_UPSERT_SUCCESS, savedProduct.getId());
        return productMapper.toResponse(savedProduct);
    }

    @Override
    public ProductResponse getByIdResponse(Long productId) {
        log.info(ProductLogMessages.LOG_PRODUCT_GET_BY_ID, productId);
        Product product = getById(productId);
        return productMapper.toResponse(product);
    }

    @Override
    public ProductResponse getBySlugResponse(String slug) {
        log.info(ProductLogMessages.LOG_PRODUCT_GET_BY_SLUG, slug);
        Product product = productRepositoryPort.findBySlugAndIsActiveTrueAndIsDeletedFalse(slug)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductMessages.MESSAGE_PRODUCT_NOT_FOUND_BY_SLUG, slug)));
        return productMapper.toResponse(product);
    }

    @Override
    public List<ProductResponse> getAll() {
        List<Product> products = productRepositoryPort.findAll();
        log.info(ProductLogMessages.LOG_PRODUCT_GET_ALL, products.size());
        return products.stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Override
    public PageResponse<ProductResponse> getAllPaged(ProductSearchRequest request) {
        log.info("Searching products with keyword: {}, page: {}, size: {}", 
                request.keyword(), request.page(), request.size());

        // Build base and keyword specifications
        Specification<Product> baseSpec = ProductSpecification.buildBaseSpecification();
        Specification<Product> keywordSpec = ProductSpecification.buildKeywordSearchSpecification(request.keyword());

        // Expand category IDs to include all descendants (hierarchical filtering)
        // When admin selects a parent category, products in child categories are also included
        List<Long> expandedCategoryIds = request.categoryIds() != null && !request.categoryIds().isEmpty()
                ? productCategoryService.findAllDescendantIds(request.categoryIds())
                : request.categoryIds();

        // Check if age range filter should be skipped
        // If "ALL" age range is selected, skip the filter (treat as "all ages" = no filter)
        List<Long> ageRangeIdsToFilter = request.ageRangeIds();
        if (ageRangeIdsToFilter != null && !ageRangeIdsToFilter.isEmpty()) {
            // Get "ALL" age range ID once (optimize)
            ProductAgeRange allAgeRange = productAgeRangeService.findByName("ALL");
            // Check if any selected age range is "ALL"
            boolean hasAllAgeRange = allAgeRange != null 
                    && ageRangeIdsToFilter.contains(allAgeRange.getId());
            // If "ALL" is selected, skip age range filter
            if (hasAllAgeRange) {
                ageRangeIdsToFilter = null;
            }
        }

        // Build all filter specifications
        List<Specification<Product>> filterSpecs = new ArrayList<>();
        filterSpecs.add(ProductSpecification.buildCategoryFilterSpecification(expandedCategoryIds));
        filterSpecs.add(ProductSpecification.buildBrandFilterSpecification(request.brandId()));
        filterSpecs.add(ProductSpecification.buildPetTypeFilterSpecification(request.petTypes()));
        filterSpecs.add(ProductSpecification.buildAgeRangeFilterSpecification(ageRangeIdsToFilter));
        filterSpecs.add(ProductSpecification.buildStatusFilterSpecification(request.status()));
        filterSpecs.add(ProductSpecification.buildStockFilterSpecification(
                request.stockStatus(), request.stockThreshold(), request.includeDeletedVariants()));
        filterSpecs.add(ProductSpecification.buildDateRangeFilterSpecification(
                request.createdAtFrom(), request.createdAtTo()));
        filterSpecs.add(ProductSpecification.buildMissingFeaturedImageFilterSpecification(request.missingFeaturedImage()));
        filterSpecs.add(ProductSpecification.buildMissingDescriptionFilterSpecification(request.missingDescription()));

        // Combine all specifications
        Specification<Product> filterSpec = ProductSpecification.combineAll(filterSpecs);
        Specification<Product> combinedSpec = baseSpec;
        combinedSpec = ProductSpecification.combine(combinedSpec, keywordSpec);
        combinedSpec = ProductSpecification.combine(combinedSpec, filterSpec);

        // Create pageable với sort từ request
        ProductSortField sortField = request.getSortField();
        Sort.Direction direction = request.getSortDir() == SortDirection.ASC
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(request.page(), request.size(), 
                Sort.by(direction, sortField.getFieldName()));
        
        log.info("Sort by: {} {}", sortField.getFieldName(), direction);

        Page<Product> productPage = productRepositoryPort.findAll(combinedSpec, pageable);

        Page<ProductResponse> productResponsePage = productPage.map(productMapper::toResponse);

        log.info("Found {} products (page {} of {})", 
                productPage.getTotalElements(), request.page(), productPage.getTotalPages());


        return PageResponse.fromPage(productResponsePage);
    }

    @Override
    @Transactional
    public void delete(Long productId) {
        log.info(ProductLogMessages.LOG_PRODUCT_DELETE_START, productId);
        Product product = getByIdAndIsDeletedFalse(productId);
        product.setDeleted(true);
        product.setActive(false);
        productRepositoryPort.save(product);
        log.info(ProductLogMessages.LOG_PRODUCT_DELETE_SUCCESS, productId);
    }

    private void validateSlugUniqueness(String slug, Long excludeProductId) {
        if (productRepositoryPort.existsBySlug(slug)) {
            // Check if it's the same product (for update)
            if (excludeProductId != null) {
                Product existing = productRepositoryPort.findByIdAndIsDeletedFalse(excludeProductId)
                        .orElse(null);
                if (existing != null && existing.getSlug().equals(slug)) {
                    return; // Same product, same slug - OK
                }
            }
            log.warn(ProductLogMessages.LOG_PRODUCT_SLUG_ALREADY_EXISTS, slug);
            throw new IllegalArgumentException(String.format(ProductMessages.MESSAGE_PRODUCT_SLUG_ALREADY_EXISTS, slug));
        }
    }

    private void validateBarcodeUniqueness(String barcode, Long excludeProductId) {
        if (barcode == null || barcode.trim().isEmpty()) {
            return; // Barcode is optional
        }
        if (productRepositoryPort.existsByBarcode(barcode)) {
            // Check if it's the same product (for update)
            if (excludeProductId != null) {
                Product existing = productRepositoryPort.findByIdAndIsDeletedFalse(excludeProductId)
                        .orElse(null);
                if (existing != null && barcode.equals(existing.getBarcode())) {
                    return; // Same product, same barcode - OK
                }
            }
            log.warn(ProductLogMessages.LOG_PRODUCT_BARCODE_ALREADY_EXISTS, barcode);
            throw new IllegalArgumentException(String.format(ProductMessages.MESSAGE_PRODUCT_BARCODE_ALREADY_EXISTS, barcode));
        }
    }

    private void setProductRelationships(Product product, ProductRequest request) {
        // Set brand
        if (request.brandId() != null) {
            ProductBrand brand = getBrandById(request.brandId());
            product.setBrand(brand);
        } else {
            product.setBrand(null);
        }


        if (!request.categoryIds().isEmpty()) {
            List<ProductCategory> categories = request.categoryIds().stream()
                    .map(this::getCategoryById)
                    .toList();
            product.setCategories(categories);
        } else {
            product.setCategories(new ArrayList<>());
        }

    
        if (!request.tagIds().isEmpty()) {
            List<ProductTag> tags = request.tagIds().stream()
                    .map(this::getTagById)
                    .toList();
            product.setTags(tags);
        } else {
            product.setTags(new ArrayList<>());
        }

        // Set age ranges (ProductRequest ensures ageRangeIds is never null)
        if (!request.ageRangeIds().isEmpty()) {
            List<ProductAgeRange> ageRanges = request.ageRangeIds().stream()
                    .map(this::getAgeRangeById)
                    .toList();
            product.setAgeRanges(ageRanges);
        } else {
            product.setAgeRanges(new ArrayList<>());
        }
    }

    private ProductBrand getBrandById(Long brandId) {
        return productBrandService.getById(brandId);
    }

    private ProductCategory getCategoryById(Long categoryId) {
        return productCategoryService.getById(categoryId);
    }

    private ProductTag getTagById(Long tagId) {
        return productTagService.getById(tagId);
    }

    private ProductAgeRange getAgeRangeById(Long ageRangeId) {
        return productAgeRangeService.getById(ageRangeId);
    }
}


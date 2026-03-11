package fpt.teddypet.application.service.products;

import fpt.teddypet.application.constants.products.product.ProductLogMessages;
import fpt.teddypet.application.constants.products.product.ProductMessages;
import fpt.teddypet.application.dto.request.products.product.ProductRequest;
import fpt.teddypet.application.dto.request.products.product.ProductSearchRequest;
import fpt.teddypet.application.dto.request.products.product.ProductHomeSearchRequest;
import fpt.teddypet.application.dto.request.products.product.ProductSortField;
import fpt.teddypet.application.dto.common.SortDirection;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.dto.response.product.product.ProductDetailResponse;
import fpt.teddypet.application.dto.response.product.product.ProductSuggestionResponse;
import fpt.teddypet.application.mapper.products.ProductMapper;
import fpt.teddypet.application.dto.request.products.variant.ProductVariantSaveRequest;
import fpt.teddypet.application.port.input.products.ProductAgeRangeService;
import fpt.teddypet.application.port.input.products.ProductAttributeService;
import fpt.teddypet.application.port.input.products.ProductBrandService;
import fpt.teddypet.application.port.input.products.ProductCategoryService;
import fpt.teddypet.application.port.input.products.ProductImageService;
import fpt.teddypet.application.port.input.products.ProductService;
import fpt.teddypet.application.port.input.products.ProductTagService;
import fpt.teddypet.application.port.input.products.ProductVariantService;
import fpt.teddypet.application.port.output.products.ProductRepositoryPort;
import fpt.teddypet.application.port.output.products.ProductVariantRepositoryPort;
import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.application.util.HtmlUtil;
import fpt.teddypet.application.util.ValidationUtils;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.domain.entity.ProductAgeRange;
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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import fpt.teddypet.application.dto.request.products.image.ProductImageSaveRequest;
import fpt.teddypet.domain.entity.ProductVariant;
import fpt.teddypet.domain.enums.ProductTypeEnum;
import fpt.teddypet.domain.enums.StockStatusEnum;
import fpt.teddypet.domain.enums.UnitEnum;
import fpt.teddypet.application.util.SkuUtil;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductApplicationService implements ProductService {

    private final ProductRepositoryPort productRepositoryPort;
    private final ProductMapper productMapper;
    private final ProductImageService productImageService;
    private final ProductVariantService productVariantService;
    private final ProductBrandService productBrandService;
    private final ProductCategoryService productCategoryService;
    private final ProductTagService productTagService;
    private final ProductAgeRangeService productAgeRangeService;
    private final ProductAttributeService productAttributeService;
    private final ProductVariantRepositoryPort productVariantRepositoryPort;

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
    public void create(ProductRequest request) {
        log.info(ProductLogMessages.LOG_PRODUCT_UPSERT_START, request.name());

        // Generate slug from name
        String slug = SlugUtil.toSlug(request.name());
        validateSlugUniqueness(slug, null);

        Product product = Product.builder().build();
        productMapper.updateProductFromRequest(request, product);
        product.setSlug(slug);

        // Auto-generate SKU for internal warehouse management
        generateAndSetProductSku(product, request, null);

        // Auto-generate SEO metadata if not provided
        generateAndSetSeoMetadata(product, request);

        // Set barcode if provided by user
        if (request.barcode() != null && !request.barcode().trim().isEmpty()) {
            validateBarcodeUniqueness(request.barcode().trim(), null);
            product.setBarcode(request.barcode().trim());
        }

        // Set default values
        if (request.status() == null) {
            product.setStatus(ProductStatusEnum.DRAFT);
        }
        if (product.getViewCount() == null) {
            product.setViewCount(0);
        }
        if (product.getSoldCount() == null) {
            product.setSoldCount(0);
        }

        setProductRelationships(product, request);
        product.setActive(true);
        product.setDeleted(false);

        Product savedProduct = productRepositoryPort.save(product);
        log.info(ProductLogMessages.LOG_PRODUCT_UPSERT_SUCCESS, savedProduct.getId());

        if (request.images() != null && !request.images().isEmpty()) {
            productImageService.saveImages(new ProductImageSaveRequest(savedProduct.getId(), request.images()));
        }

        if (request.variants() != null && !request.variants().isEmpty()) {
            productVariantService.saveVariants(new ProductVariantSaveRequest(savedProduct.getId(), request.variants()));
        } else if (ProductTypeEnum.SIMPLE.equals(product.getProductType())) {
            // Case: Simple product without variants provided - create a default variant
            createDefaultVariant(savedProduct);
        }

        recalculateProductMetadata(savedProduct.getId());
    }

    @Override
    @Transactional
    public void update(Long productId, ProductRequest request) {
        log.info(ProductLogMessages.LOG_PRODUCT_UPSERT_START, request.name());

        Product product = getByIdAndIsDeletedFalse(productId);

        String newSlug;
        if (request.slug() != null && !request.slug().trim().isEmpty()) {
            newSlug = request.slug().trim();
        } else {
            newSlug = SlugUtil.toSlug(request.name());
        }

        if (!product.getSlug().equals(newSlug)) {
            validateSlugUniqueness(newSlug, productId);
        }

        productMapper.updateProductFromRequest(request, product);

        // Regenerate SKU if product attributes change
        generateAndSetProductSku(product, request, productId);

        // Update SEO metadata
        generateAndSetSeoMetadata(product, request);

        // Update barcode if provided
        if (request.barcode() != null && !request.barcode().trim().isEmpty()) {
            if (!request.barcode().trim().equals(product.getBarcode())) {
                validateBarcodeUniqueness(request.barcode().trim(), productId);
            }
            product.setBarcode(request.barcode().trim());
        } else {
            product.setBarcode(null);
        }

        setProductRelationships(product, request);

        Product savedProduct = productRepositoryPort.save(product);
        log.info(ProductLogMessages.LOG_PRODUCT_UPSERT_SUCCESS, savedProduct.getId());

        if (request.images() != null) {
            productImageService.saveImages(new ProductImageSaveRequest(savedProduct.getId(), request.images()));
        }

        if (request.variants() != null) {
            productVariantService.saveVariants(new ProductVariantSaveRequest(savedProduct.getId(), request.variants()));
        }

        recalculateProductMetadata(savedProduct.getId());
    }

    @Override
    @Transactional
    public void recalculateProductMetadata(Long productId) {
        Product product = getById(productId);

        // Fetch variants explicitly to ensure fresh data
        List<ProductVariant> variants = productVariantRepositoryPort.findByProductId(productId);

        if (variants == null || variants.isEmpty()) {
            product.setMinPrice(BigDecimal.ZERO);
            product.setMaxPrice(BigDecimal.ZERO);
            product.setStockStatus(StockStatusEnum.OUT_OF_STOCK);
        } else {
            List<ProductVariant> activeVariants = variants.stream()
                    .filter(v -> !v.isDeleted() && v.isActive() && ProductStatusEnum.ACTIVE.equals(v.getStatus()))
                    .toList();

            if (activeVariants.isEmpty()) {
                product.setMinPrice(BigDecimal.ZERO);
                product.setMaxPrice(BigDecimal.ZERO);
            } else {
                BigDecimal min = activeVariants.stream()
                        .map(v -> v.getPrice().getEffectivePrice())
                        .min(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);

                BigDecimal max = activeVariants.stream()
                        .map(v -> v.getPrice().getEffectivePrice())
                        .max(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);

                product.setMinPrice(min);
                product.setMaxPrice(max);
            }

            int totalStock = activeVariants.stream()
                    .mapToInt(v -> v.getStockQuantity().getValue())
                    .sum();

            product.updateStockStatus(totalStock);
        }

        productRepositoryPort.save(product);
        log.info("Updated metadata for product {}: Price Range [{} - {}], Stock Status: {}",
                productId, product.getMinPrice(), product.getMaxPrice(), product.getStockStatus());
    }

    private void createDefaultVariant(Product product) {
        log.info("Creating default variant for simple product: {}", product.getName());
        productVariantService.saveVariants(new ProductVariantSaveRequest(
                product.getId(),
                List.of(new fpt.teddypet.application.dto.request.products.variant.ProductVariantRequest(
                        null,
                        product.getId(),
                        0, 0, 0, 0, // Dimensions (Integer)
                        BigDecimal.valueOf(100000), // Base Price
                        null, // Sale Price
                        100, // Stock
                        UnitEnum.PIECE,
                        null,
                        "Mặc định",
                        null,
                        ProductStatusEnum.ACTIVE,
                        new ArrayList<>()))));
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
    public ProductDetailResponse getDetail(Long productId) {
        Product product = getById(productId);
        return mapToDetailResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDetailResponse getDetailBySlug(String slug) {
        Product product = productRepositoryPort.findBySlugAndIsActiveTrueAndIsDeletedFalse(slug)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductMessages.MESSAGE_PRODUCT_NOT_FOUND_BY_SLUG, slug)));
        return mapToDetailResponse(product);
    }

    private ProductDetailResponse mapToDetailResponse(Product product) {
        return productMapper.toDetailResponse(product)
                .toBuilder()
                .categories(productCategoryService.toInfos(product.getCategories(), false, false))
                .tags(productTagService.toInfos(product.getTags(), false, false))
                .ageRanges(productAgeRangeService.toInfos(product.getAgeRanges(), false, false))
                .attributes(productAttributeService.toInfos(product.getAttributes(), false, false))
                .images(productImageService.toInfos(product.getImages(), false, false))
                .variants(productVariantService.getByProductId(product.getId(), false, false))
                .brand(productBrandService.toInfo(product.getBrand(), false, false))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getAllPaged(ProductSearchRequest request) {
        log.info("Searching products with keyword: {}, page: {}, size: {}",
                request.keyword(), request.page(), request.size());

        // Build base and keyword specifications
        Specification<Product> baseSpec = ProductSpecification.buildBaseSpecification();
        Specification<Product> keywordSpec = ProductSpecification.buildKeywordSearchSpecification(request.keyword());

        // Expand category IDs to include all descendants (hierarchical filtering)
        // When admin selects a parent category, products in child categories are also
        // included
        List<Long> expandedCategoryIds = request.categoryIds() != null && !request.categoryIds().isEmpty()
                ? productCategoryService.findAllDescendantIds(request.categoryIds())
                : request.categoryIds();

        // Check if age range filter should be skipped
        // If "ALL" age range is selected, skip the filter (treat as "all ages" = no
        // filter)
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
        filterSpecs
                .add(ProductSpecification.buildMissingFeaturedImageFilterSpecification(request.missingFeaturedImage()));
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

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProductsByCategorySlug(String slug, int page, int size, String sortKey,
            String sortDirection) {
        log.info("Getting products by category slug: {}, page: {}, size: {}, sortKey: {}, sortDirection: {}", slug,
                page, size, sortKey, sortDirection);

        if (slug == null || slug.isBlank()) {
            return PageResponse.fromPage(Page.empty());
        }

        Specification<Product> spec = ProductSpecification.combineAll(Arrays.asList(
                ProductSpecification.buildBaseSpecification(),
                ProductSpecification.buildCategorySlugsFilterSpecification(List.of(slug))));

        Pageable pageable = PageRequest.of(page, size, buildSort(sortKey, sortDirection));
        Page<Product> productPage = productRepositoryPort.findAll(spec, pageable);

        return PageResponse.fromPage(productPage.map(productMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProductsByBrandSlug(String slug, int page, int size, String sortKey,
            String sortDirection) {
        log.info("Getting products by brand slug: {}, page: {}, size: {}, sortKey: {}, sortDirection: {}", slug, page,
                size, sortKey, sortDirection);

        if (slug == null || slug.isBlank()) {
            return PageResponse.fromPage(Page.empty());
        }

        Specification<Product> spec = ProductSpecification.combineAll(Arrays.asList(
                ProductSpecification.buildBaseSpecification(),
                ProductSpecification.buildBrandSlugsFilterSpecification(List.of(slug))));

        Pageable pageable = PageRequest.of(page, size, buildSort(sortKey, sortDirection));
        Page<Product> productPage = productRepositoryPort.findAll(spec, pageable);

        return PageResponse.fromPage(productPage.map(productMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getHomeProducts(ProductHomeSearchRequest request) {
        log.info("Searching home products with filters: {}", request);

        Specification<Product> spec = ProductSpecification.combineAll(Arrays.asList(
                ProductSpecification.buildBaseSpecification(),
                ProductSpecification.buildKeywordSearchSpecification(request.keyword()),
                ProductSpecification.buildCategorySlugsFilterSpecification(request.categorySlugs()),
                ProductSpecification.buildBrandSlugsFilterSpecification(request.brandSlugs()),
                ProductSpecification.buildTagSlugsFilterSpecification(request.tagSlugs()),
                ProductSpecification.buildPriceRangeSpecification(request.minPrice(), request.maxPrice())));

        Pageable pageable = PageRequest.of(request.page(), request.size(),
                buildSort(request.sortKey(), request.sortDirection()));
        Page<Product> productPage = productRepositoryPort.findAll(spec, pageable);

        return PageResponse.fromPage(productPage.map(productMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getRelatedProducts(Long productId, int limit) {
        log.info("Getting related products for product: {}, limit: {}", productId, limit);

        Product product = getByIdAndIsDeletedFalse(productId);
        List<Long> categoryIds = product.getCategories().stream()
                .map(fpt.teddypet.domain.entity.ProductCategory::getId)
                .toList();

        Pageable pageable = PageRequest.of(0, limit);
        Page<Product> productPage;

        if (categoryIds.isEmpty()) {
            productPage = Page.empty();
        } else {
            productPage = productRepositoryPort.findRelatedProducts(categoryIds, productId, pageable);
        }

        return PageResponse.fromPage(productPage.map(productMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSuggestionResponse> getSuggestions(String keyword) {
        log.info("Getting search suggestions for keyword: {}", keyword);

        Specification<Product> spec = ProductSpecification.combineAll(Arrays.asList(
                ProductSpecification.buildBaseSpecification(),
                ProductSpecification.buildKeywordSearchSpecification(keyword)));

        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "viewCount", "soldCount"));
        Page<Product> productPage = productRepositoryPort.findAll(spec, pageable);

        return productPage.getContent().stream()
                .map(product -> ProductSuggestionResponse.builder()
                        .productId(product.getId())
                        .name(product.getName())
                        .slug(product.getSlug())
                        .imageUrl(product.getImages().isEmpty() ? null : product.getImages().getFirst().getImageUrl())
                        .build())
                .toList();
    }

    private Sort buildSort(String sortKey, String sortDirection) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;

        if (sortKey == null || sortKey.isBlank() || sortKey.equalsIgnoreCase("default")) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }

        // Map sortKey to actual field name for search-friendly keys
        String field;
        if ("price".equalsIgnoreCase(sortKey)) {
            field = "minPrice";
        } else if ("latest".equalsIgnoreCase(sortKey) || "date".equalsIgnoreCase(sortKey)) {
            field = "createdAt";
        } else {
            field = sortKey;
        }

        // Safety check to prevent PropertyReferenceException for invalid fields
        List<String> allowedFields = List.of("createdAt", "minPrice", "name", "soldCount", "viewCount", "slug");
        if (!allowedFields.contains(field)) {
            log.warn("Invalid sort key provided: {}, defaulting to createdAt", sortKey);
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }

        return Sort.by(direction, field);
    }

    private void validateSlugUniqueness(String slug, Long excludeProductId) {
        if (excludeProductId != null) {
            Product existing = productRepositoryPort.findByIdAndIsDeletedFalse(excludeProductId).orElse(null);
            if (existing != null && existing.getSlug().equals(slug)) {
                return; // Same product, same slug - OK
            }
        }

        ValidationUtils.ensureUnique(
                () -> productRepositoryPort.existsBySlug(slug),
                String.format(ProductMessages.MESSAGE_PRODUCT_SLUG_ALREADY_EXISTS, slug));

        if (productRepositoryPort.existsBySlug(slug)) {
            log.warn(ProductLogMessages.LOG_PRODUCT_SLUG_ALREADY_EXISTS, slug);
        }
    }

    private void validateSkuUniqueness(String sku, Long excludeProductId) {
        if (excludeProductId != null) {
            Product existing = productRepositoryPort.findByIdAndIsDeletedFalse(excludeProductId).orElse(null);
            if (existing != null && sku.equals(existing.getSku())) {
                return; // Same product, same SKU - OK
            }
        }

        ValidationUtils.ensureUnique(
                () -> productRepositoryPort.existsBySku(sku),
                String.format("SKU '%s' đã tồn tại", sku));
    }

    private void validateBarcodeUniqueness(String barcode, Long excludeProductId) {
        if (barcode == null || barcode.trim().isEmpty()) {
            return; // Barcode is optional
        }

        if (excludeProductId != null) {
            Product existing = productRepositoryPort.findByIdAndIsDeletedFalse(excludeProductId).orElse(null);
            if (existing != null && barcode.equals(existing.getBarcode())) {
                return; // Same product, same barcode - OK
            }
        }

        ValidationUtils.ensureUnique(
                () -> productRepositoryPort.existsByBarcode(barcode),
                String.format(ProductMessages.MESSAGE_PRODUCT_BARCODE_ALREADY_EXISTS, barcode));

        if (productRepositoryPort.existsByBarcode(barcode)) {
            log.warn(ProductLogMessages.LOG_PRODUCT_BARCODE_ALREADY_EXISTS, barcode);
        }
    }

    /**
     * Generate and set product SKU based on brand, category, and name
     */
    private void generateAndSetProductSku(Product product, ProductRequest request, Long productId) {
        String brandName = request.brandId() != null
                ? productBrandService.getByIdAndStatusAndDeleted(request.brandId(), true, false).getName()
                : "NB";

        String categoryName = "GEN";
        if (request.categoryIds() != null && !request.categoryIds().isEmpty()) {
            var categories = productCategoryService.getAllByIdsAndActiveAndDeleted(
                    request.categoryIds(), true, false);
            if (!categories.isEmpty()) {
                categoryName = categories.getFirst().getName();
            }
        }

        String generatedSku = SkuUtil.generateProductSku(
                brandName, categoryName, request.name());

        if (!generatedSku.equals(product.getSku())) {
            validateSkuUniqueness(generatedSku, productId);
            product.setSku(generatedSku);
        }
    }

    private void setProductRelationships(Product product, ProductRequest request) {

        product.setBrand(productBrandService.getByIdAndStatusAndDeleted(
                request.brandId(),
                true,
                false));

        product.setCategories(productCategoryService.getAllByIdsAndActiveAndDeleted(
                request.categoryIds(),
                true,
                false));

        product.setTags(productTagService.getAllByIdsAndActiveAndDeleted(
                request.tagIds(),
                true,
                false));

        product.setAgeRanges(productAgeRangeService.getAllByIdsAndActiveAndDeleted(
                request.ageRangeIds(),
                true,
                false));

        product.setAttributes(productAttributeService.getAllByIdsAndActiveAndDeleted(
                request.attributeIds(),
                true,
                false));
    }

    /**
     * Auto-generate SEO meta title and description if not provided by user
     */
    private void generateAndSetSeoMetadata(Product product, ProductRequest request) {
        // Handle Meta Title
        if (request.metaTitle() == null || request.metaTitle().trim().isEmpty()) {
            product.setMetaTitle(request.name());
        } else {
            product.setMetaTitle(request.metaTitle().trim());
        }

        // Handle Meta Description
        if (request.metaDescription() == null || request.metaDescription().trim().isEmpty()) {
            String plainDescription = HtmlUtil.stripHtml(request.description());
            product.setMetaDescription(HtmlUtil.truncate(plainDescription, 155));
        } else {
            product.setMetaDescription(request.metaDescription().trim());
        }
    }

}

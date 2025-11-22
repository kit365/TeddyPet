package fpt.teddypet.application.service.product;

import fpt.teddypet.application.constants.productvariant.ProductVariantLogMessages;
import fpt.teddypet.application.constants.productvariant.ProductVariantMessages;
import fpt.teddypet.application.dto.request.product.variant.ProductVariantRequest;
import fpt.teddypet.application.dto.request.product.variant.ProductVariantSaveRequest;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;
import fpt.teddypet.application.mapper.ProductVariantMapper;
import fpt.teddypet.application.port.input.ProductService;
import fpt.teddypet.application.port.input.ProductVariantService;
import fpt.teddypet.application.port.output.ProductAttributeValueRepositoryPort;
import fpt.teddypet.application.port.output.ProductVariantRepositoryPort;
import fpt.teddypet.application.util.ValidationUtils;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.domain.entity.ProductAttributeValue;
import fpt.teddypet.domain.entity.ProductImage;
import fpt.teddypet.domain.entity.ProductVariant;
import fpt.teddypet.domain.valueobject.Dimensions;
import fpt.teddypet.domain.valueobject.Price;
import fpt.teddypet.domain.valueobject.Sku;
import fpt.teddypet.domain.valueobject.StockQuantity;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

import static fpt.teddypet.domain.valueobject.Price.toPrice;

@Slf4j
@Service
public class ProductVariantApplicationService implements ProductVariantService {

    private final ProductVariantRepositoryPort productVariantRepositoryPort;
    private final ProductVariantMapper productVariantMapper;
    private final ProductService productService;
    private final ProductAttributeValueRepositoryPort productAttributeValueRepositoryPort;

    public ProductVariantApplicationService(
            ProductVariantRepositoryPort productVariantRepositoryPort,
            ProductVariantMapper productVariantMapper,
            @Lazy ProductService productService,
            ProductAttributeValueRepositoryPort productAttributeValueRepositoryPort) {
        this.productVariantRepositoryPort = productVariantRepositoryPort;
        this.productVariantMapper = productVariantMapper;
        this.productService = productService;
        this.productAttributeValueRepositoryPort = productAttributeValueRepositoryPort;
    }


    private ProductVariant upsertVariant(ProductVariantRequest request) {
        Product product = productService.getById(request.productId());

        ProductVariant variant;
        boolean isUpdate = request.variantId() != null;

        Price price = toPrice(request.salePrice(), request.price());

        StockQuantity stockQuantity = StockQuantity.of(request.stockQuantity());

        Dimensions dimensions = Dimensions.of(
                request.weight(),
                request.length(),
                request.width(),
                request.height()
        );

        if (isUpdate) {
            variant = getById(request.variantId());
        } else {
            // For new variant, check if deleted variant exists with same SKU
            variant = ProductVariant.builder().build();
        }

        productVariantMapper.updateVariantFromRequest(request, variant);

        variant.setProduct(product);
        variant.setPrice(price);
        variant.setStockQuantity(stockQuantity);
        variant.setDimensions(dimensions);

        if (request.featuredImageId() != null) {
            ProductImage featuredImage = product.getImages().stream()
                    .filter(img -> img.getId().equals(request.featuredImageId()))
                    .findFirst()
                    .orElse(null);
            variant.setFeaturedImage(featuredImage);
        }

        // Load and set attributeValues if provided
        List<ProductAttributeValue> attributeValues = new ArrayList<>();
        if (request.attributeValueIds() != null && !request.attributeValueIds().isEmpty()) {
            Set<Long> valueIds = new java.util.HashSet<>(request.attributeValueIds());
            attributeValues = productAttributeValueRepositoryPort.findByIds(valueIds);

            if (attributeValues.size() != valueIds.size()) {
                Set<Long> foundIds = attributeValues.stream()
                        .map(ProductAttributeValue::getValueId)
                        .collect(Collectors.toSet());
                Set<Long> missingIds = valueIds.stream()
                        .filter(id -> !foundIds.contains(id))
                        .collect(Collectors.toSet());
                throw new EntityNotFoundException(
                        String.format("Không tìm thấy giá trị thuộc tính với ID: %s", missingIds));
            }

            variant.setAttributeValues(attributeValues);
        }

        // Auto-generate name from attributeValues
        generateNameFromAttributeValues(variant);

        // Auto-generate SKU
        String generatedSku = generateSkuForVariant(product, attributeValues);
        Sku sku = Sku.of(generatedSku);
        
        // Validate SKU uniqueness only if SKU changed
        if (!isUpdate || variant.getSku() == null || !variant.getSku().getValue().equals(sku.getValue())) {
            validateSkuUniqueness(sku.getValue(), variant.getSku() != null ? variant.getSku().getValue() : null, variant.getVariantId());
        }
        
        variant.setSku(sku);

        return variant;
    }

    private List<ProductVariant> prepareVariantsForBatch(List<ProductVariantRequest> requests) {
        return requests.stream()
                .map(this::upsertVariant)
                .toList();
    }





    @Override
    @Transactional
    public List<ProductVariantResponse> saveVariants(ProductVariantSaveRequest request) {
        Long productId = request.productId();
        List<ProductVariantRequest> newVariants = request.variants() != null ? request.variants() : List.of();

        log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_SAVE_VARIANTS_START, productId);

        try {
            // Lấy danh sách variants hiện tại của product (chưa bị xóa)
            List<ProductVariant> existingVariants = productVariantRepositoryPort.findByProductId(productId);

            // Lấy danh sách variantId từ request mới
            Set<Long> newVariantIds = newVariants.stream()
                    .map(ProductVariantRequest::variantId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            // Xóa các variants có trong DB nhưng không có trong request mới
            Set<Long> variantIdsToDelete = existingVariants.stream()
                    .map(ProductVariant::getVariantId)
                    .filter(variantId -> !newVariantIds.contains(variantId))
                    .collect(Collectors.toSet());

            if (!variantIdsToDelete.isEmpty()) {
                productVariantRepositoryPort.softDeleteByIds(variantIdsToDelete);
                log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_SAVE_VARIANTS_DELETE, variantIdsToDelete.size());
            }

            // Nếu không có variants mới, trả về danh sách rỗng
            if (newVariants.isEmpty()) {
                log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_SAVE_VARIANTS_SUCCESS, 0, productId);
                return List.of();
            }

            // Đảm bảo productId trong tất cả requests khớp với productId của save request
            List<ProductVariantRequest> requestsWithProductId = newVariants.stream()
                    .map(variantRequest -> new ProductVariantRequest(
                            variantRequest.variantId(),
                            productId, // Sử dụng productId từ save request
                            variantRequest.weight(),
                            variantRequest.length(),
                            variantRequest.width(),
                            variantRequest.height(),
                            variantRequest.price(),
                            variantRequest.salePrice(),
                            variantRequest.stockQuantity(),
                            variantRequest.unit(),
                            variantRequest.featuredImageId(),
                            variantRequest.attributeValueIds()
                    ))
                    .toList();

            // Tạo hoặc cập nhật các variants (sử dụng batch save)
            List<ProductVariant> savedVariants = productVariantRepositoryPort.saveAll(prepareVariantsForBatch(requestsWithProductId));
            log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_SAVE_VARIANTS_SUCCESS, savedVariants.size(), productId);
            return savedVariants.stream()
                    .map(productVariantMapper::toResponse)
                    .toList();
        } catch (Exception e) {
            log.error(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_SAVE_VARIANTS_ERROR, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ProductVariantResponse getByIdResponse(Long variantId) {
        log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_GET_BY_ID, variantId);
        ProductVariant variant = getById(variantId);
        return productVariantMapper.toResponse(variant);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductVariantResponse> getByProductId(Long productId) {
        return getByProductId(productId, false, true);
    }

    @Override
    public List<ProductVariantResponse> getByProductId(Long productId, boolean includeDeleted) {
        return getByProductId(productId, includeDeleted, false);
    }

    @Override
    public List<ProductVariantResponse> getByProductId(Long productId, boolean includeDeleted, boolean onlyActive) {
        List<ProductVariant> variants = productVariantRepositoryPort.findByProductId(productId);
        log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_GET_BY_PRODUCT_ID, productId, variants.size());
        return variants.stream()
                .filter(variant -> includeDeleted || !variant.isDeleted())
                .filter(variant -> !onlyActive || variant.isActive())
                .map(productVariantMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long variantId) {
        log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_DELETE_START, variantId);
        try {
            ProductVariant variant = getById(variantId);
            deleteVariant(variant);
            log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_DELETE_SUCCESS, variantId);
        } catch (Exception e) {
            log.error(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_DELETE_ERROR, e.getMessage(), e);
            throw e;
        }
    }

    private void deleteVariant(ProductVariant variant) {
        variant.setDeleted(true);
        variant.setActive(false);
        productVariantRepositoryPort.save(variant);
    }

    private ProductVariant getById(Long variantId) {
        return productVariantRepositoryPort.findById(variantId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductVariantMessages.MESSAGE_PRODUCT_VARIANT_NOT_FOUND_BY_ID, variantId)));
    }

    private void validateSkuUniqueness(String newSku, String currentSku, Long variantId) {
        if (currentSku != null && currentSku.equals(newSku)) {
            return;
        }

        ValidationUtils.ensureUnique(
            () -> variantId != null
                ? productVariantRepositoryPort.existsBySkuAndVariantIdNot(newSku, variantId)
                : productVariantRepositoryPort.existsBySku(newSku),
            ProductVariantMessages.MESSAGE_SKU_ALREADY_EXISTS
        );
    }

    /**
     * Tự động sinh name từ attributeValues
     * Format: "Attribute1: Value1 - Attribute2: Value2"
     * Sắp xếp theo displayOrder của attribute và value
     */
    private void generateNameFromAttributeValues(ProductVariant variant) {
        ValidationUtils.ensureNotNull(
            variant.getAttributeValues(),
            "attributeValueIds là bắt buộc để tự động sinh tên biến thể."
        );
        
        ValidationUtils.ensure(
            !variant.getAttributeValues().isEmpty(),
            "attributeValueIds là bắt buộc để tự động sinh tên biến thể."
        );

        // Lấy danh sách attributeValues và sắp xếp theo displayOrder của attribute và value
        // So sánh theo displayOrder của attribute trước
        // Nếu cùng attribute, so sánh theo displayOrder của value
        List<ProductAttributeValue> sortedValues = variant.getAttributeValues().stream()
                .sorted(Comparator.comparingInt((ProductAttributeValue v) -> v.getAttribute().getDisplayOrder()).thenComparingInt(ProductAttributeValue::getDisplayOrder))
                .toList();

        // Ghép chuỗi: "Attribute: Value - Attribute: Value"
        String generatedName = sortedValues.stream()
                .map(value -> value.getAttribute().getName() + ": " + value.getValue())
                .collect(java.util.stream.Collectors.joining(" - "));

        // Tự động cập nhật name từ attributeValues
        variant.setName(generatedName);
    }

    /**
     * Auto-generate SKU for ProductVariant
     * Uses parent product SKU + attribute values
     */
    private String generateSkuForVariant(Product product, List<ProductAttributeValue> attributeValues) {
        // Get parent SKU from product sku field
        String parentSku = product.getSku();
        
        if (parentSku == null || parentSku.isBlank()) {
            // Fallback: generate parent SKU if not exists
            String brandName = product.getBrand() != null ? product.getBrand().getName() : "NB";
            String categoryName = !product.getCategories().isEmpty() 
                    ? product.getCategories().getFirst().getName()
                    : "GEN";
            parentSku = fpt.teddypet.application.util.SkuUtil.generateProductSku(
                    brandName, categoryName, product.getName());
        }
        
        // Extract attribute value names
        List<String> attrNames = attributeValues.stream()
                .map(ProductAttributeValue::getValue)
                .toList();
        
        // Generate variant SKU: PARENT-ATTR1-ATTR2
        return fpt.teddypet.application.util.SkuUtil.generateVariantSku(parentSku, attrNames);
    }
}


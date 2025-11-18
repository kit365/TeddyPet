package fpt.teddypet.application.service;

import fpt.teddypet.application.constants.productvariant.ProductVariantLogMessages;
import fpt.teddypet.application.constants.productvariant.ProductVariantMessages;
import fpt.teddypet.application.dto.request.ProductVariantRequest;
import fpt.teddypet.application.dto.request.ProductVariantSaveRequest;
import fpt.teddypet.application.dto.response.ProductVariantResponse;
import fpt.teddypet.application.mapper.ProductVariantMapper;
import fpt.teddypet.application.port.input.ProductService;
import fpt.teddypet.application.port.input.ProductVariantService;
import fpt.teddypet.application.port.output.ProductVariantRepositoryPort;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.domain.entity.ProductImage;
import fpt.teddypet.domain.entity.ProductVariant;
import fpt.teddypet.domain.valueobject.Dimensions;
import fpt.teddypet.domain.valueobject.Price;
import fpt.teddypet.domain.valueobject.Sku;
import fpt.teddypet.domain.valueobject.StockQuantity;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductVariantApplicationService implements ProductVariantService {

    private final ProductVariantRepositoryPort productVariantRepositoryPort;
    private final ProductVariantMapper productVariantMapper;
    private final ProductService productService;
 

    @Override
    @Transactional
    public ProductVariantResponse upsert(ProductVariantRequest request) {
        log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_UPSERT_START, request.sku());
        try {
            ProductVariant variant = upsertVariant(request);
            ProductVariant savedVariant = productVariantRepositoryPort.save(variant);
            log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_UPSERT_SUCCESS, savedVariant.getVariantId());
            return productVariantMapper.toResponse(savedVariant);
        } catch (Exception e) {
            log.error(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_UPSERT_ERROR, e.getMessage(), e);
            throw e;
        }
    }

    private ProductVariant upsertVariant(ProductVariantRequest request) {
        Product product = productService.getById(request.productId());

        ProductVariant variant;
        boolean isUpdate = request.variantId() != null;


        Price price = request.salePrice() != null 
                ? Price.of(request.price(), request.salePrice())
                : Price.of(request.price());
        Sku sku = Sku.of(request.sku());
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
            Optional<ProductVariant> deletedVariant = productVariantRepositoryPort.findBySkuAndIsDeletedTrue(sku.getValue());
            if (deletedVariant.isPresent()) {
                // Restore the deleted variant
                variant = deletedVariant.get();
                variant.setDeleted(false);
                variant.setActive(true);
            } else {
                variant = ProductVariant.builder().build();
            }
        }

        // Validate SKU uniqueness (skip if restoring deleted variant with same SKU)
        if (!isUpdate || variant.getSku() == null || !variant.getSku().getValue().equals(sku.getValue())) {
            validateSkuUniqueness(sku.getValue(), variant.getSku() != null ? variant.getSku().getValue() : null, variant.getVariantId());
        }

        productVariantMapper.updateVariantFromRequest(request, variant);

        variant.setProduct(product);
        variant.setPrice(price);
        variant.setSku(sku);
        variant.setStockQuantity(stockQuantity);
        variant.setDimensions(dimensions);
        
        if (request.featuredImageId() != null) {
            ProductImage featuredImage = product.getImages().stream()
                    .filter(img -> img.getId().equals(request.featuredImageId()))
                    .findFirst()
                    .orElse(null);
            variant.setFeaturedImage(featuredImage);
        }

        return variant;
    }

    private List<ProductVariant> prepareVariantsForBatch(List<ProductVariantRequest> requests) {
        return requests.stream()
                .map(this::upsertVariant)
                .toList();
    }

    @Override
    @Transactional
    public List<ProductVariantResponse> batchUpsert(List<ProductVariantRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException(ProductVariantMessages.MESSAGE_VARIANTS_LIST_EMPTY);
        }

        log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_BATCH_UPSERT_START, requests.size());

        try {
            // Validate all SKUs are unique within the batch
            validateBatchSkuUniqueness(requests);

            // Sử dụng batch save để cải thiện hiệu suất
            List<ProductVariant> variantsToSave = prepareVariantsForBatch(requests);
            List<ProductVariant> savedVariants = productVariantRepositoryPort.saveAll(variantsToSave);
            log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_BATCH_UPSERT_SUCCESS, savedVariants.size());
            return savedVariants.stream()
                    .map(productVariantMapper::toResponse)
                    .toList();
        } catch (Exception e) {
            log.error(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_BATCH_UPSERT_ERROR, e.getMessage(), e);
            throw e;
        }
    }

    private void validateBatchSkuUniqueness(List<ProductVariantRequest> requests) {
        long uniqueSkuCount = requests.stream()
                .map(ProductVariantRequest::sku)
                .distinct()
                .count();
        
        if (uniqueSkuCount != requests.size()) {
            log.warn(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_SKU_DUPLICATE, requests.size());
            throw new IllegalArgumentException(ProductVariantMessages.MESSAGE_SKU_DUPLICATE_IN_BATCH);
        }
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
            
            // Xóa các variants có trong DB nhưng không có trong request mới (sử dụng bulk update)
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
                            variantRequest.name(),
                            variantRequest.weight(),
                            variantRequest.length(),
                            variantRequest.width(),
                            variantRequest.height(),
                            variantRequest.price(),
                            variantRequest.salePrice(),
                            variantRequest.sku(),
                            variantRequest.stockQuantity(),
                            variantRequest.unit(),
                            variantRequest.featuredImageId()
                    ))
                    .toList();
            
            // Tạo hoặc cập nhật các variants (sử dụng batch save)
            validateBatchSkuUniqueness(requestsWithProductId);
            List<ProductVariant> variantsToSave = prepareVariantsForBatch(requestsWithProductId);
            List<ProductVariant> savedVariants = productVariantRepositoryPort.saveAll(variantsToSave);
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
        List<ProductVariant> variants = productVariantRepositoryPort.findByProductId(productId);
        log.info(ProductVariantLogMessages.LOG_PRODUCT_VARIANT_GET_BY_PRODUCT_ID, productId, variants.size());
        return variants.stream()
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

       
        boolean skuExists = variantId != null
                ? productVariantRepositoryPort.existsBySkuAndVariantIdNot(newSku, variantId)
                : productVariantRepositoryPort.existsBySku(newSku);

        if (skuExists) {
            throw new IllegalArgumentException(ProductVariantMessages.MESSAGE_SKU_ALREADY_EXISTS);
        }
    }

}


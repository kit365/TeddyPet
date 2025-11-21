package fpt.teddypet.application.service.product;

import fpt.teddypet.application.constants.productimage.ProductImageLogMessages;
import fpt.teddypet.application.constants.productimage.ProductImageMessages;
import fpt.teddypet.application.dto.request.product.image.ProductImageItemRequest;
import fpt.teddypet.application.dto.request.product.image.ProductImageRequest;
import fpt.teddypet.application.dto.request.product.image.ProductImageSaveRequest;
import fpt.teddypet.application.dto.response.product.image.ProductImageInfo;
import fpt.teddypet.application.dto.response.product.image.ProductImageResponse;
import fpt.teddypet.application.mapper.ProductImageMapper;
import fpt.teddypet.application.port.input.ProductImageService;
import fpt.teddypet.application.port.input.ProductService;
import fpt.teddypet.application.port.output.ProductImageRepositoryPort;
import fpt.teddypet.application.util.DisplayOrderUtil;
import fpt.teddypet.application.util.ImageAltUtil;
import fpt.teddypet.domain.entity.Product;
import fpt.teddypet.domain.entity.ProductImage;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ProductImageApplicationService implements ProductImageService {

    private final ProductImageRepositoryPort productImageRepositoryPort;
    private final ProductService productService;
    private final ProductImageMapper productImageMapper;

    public ProductImageApplicationService(
            ProductImageRepositoryPort productImageRepositoryPort,
            @Lazy ProductService productService,
            ProductImageMapper productImageMapper) {
        this.productImageRepositoryPort = productImageRepositoryPort;
        this.productService = productService;
        this.productImageMapper = productImageMapper;
    }

    @Override
    @Transactional
    public ProductImageResponse create(ProductImageRequest request) {
        log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_UPSERT_START, request.imageUrl());
        Product product = getProductById(request.productId());

        ProductImage image = ProductImage.builder().build();
        productImageMapper.updateImageFromRequest(request, image);
        image.setProduct(product);
        setAltTextIfEmpty(image, product, request.altText());
        setDisplayOrderIfNull(image, request.productId(), request.displayOrder());
        image.setActive(true);
        image.setDeleted(false);

        ProductImage savedImage = productImageRepositoryPort.save(image);
        log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_UPSERT_SUCCESS, savedImage.getId());
        return productImageMapper.toResponse(savedImage);
    }

    @Override
    @Transactional
    public ProductImageResponse update(Long imageId, ProductImageRequest request) {
        log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_UPSERT_START, request.imageUrl());
        ProductImage image = getById(imageId);
        Product product = getProductById(request.productId());

        productImageMapper.updateImageFromRequest(request, image);
        image.setProduct(product);
        setAltTextIfEmpty(image, product, request.altText());

        ProductImage savedImage = productImageRepositoryPort.save(image);
        log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_UPSERT_SUCCESS, savedImage.getId());
        return productImageMapper.toResponse(savedImage);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductImageResponse getByIdResponse(Long imageId) {
        log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_GET_BY_ID, imageId);
        ProductImage image = getById(imageId);
        return productImageMapper.toResponse(image);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductImageResponse> getByProductId(Long productId) {
        List<ProductImage> images = productImageRepositoryPort.findByProductId(productId);
        log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_GET_BY_PRODUCT_ID, images.size(), productId);
        return images.stream()
                .map(productImageMapper::toResponse)
                .toList();
    }

    @Override
    public ProductImageInfo toInfo(ProductImage image) {
        return toInfo(image, false, true);
    }

    @Override
    public ProductImageInfo toInfo(ProductImage image, boolean includeDeleted) {
        return toInfo(image, includeDeleted, false);
    }

    @Override
    public ProductImageInfo toInfo(ProductImage image, boolean includeDeleted, boolean onlyActive) {
        if (image == null) {
            return null;
        }
        if (!includeDeleted && image.isDeleted()) return null;
        if (onlyActive && !image.isActive()) return null;

        return productImageMapper.toInfo(image);
    }

    @Override
    public List<ProductImageInfo> toInfos(List<ProductImage> images) {
        return toInfos(images, false, true);
    }

    @Override
    public List<ProductImageInfo> toInfos(List<ProductImage> images, boolean includeDeleted) {
        return toInfos(images, includeDeleted, false);
    }

    @Override
    public List<ProductImageInfo> toInfos(List<ProductImage> images, boolean includeDeleted, boolean onlyActive) {
        if (images == null || images.isEmpty()) {
            return List.of();
        }

        return images.stream()
                .filter(img -> includeDeleted || !img.isDeleted())
                .filter(img -> !onlyActive || img.isActive())
                .sorted(Comparator.comparing(ProductImage::getDisplayOrder, Comparator.nullsLast(Integer::compareTo)))
                .map(productImageMapper::toInfo)
                .toList();
    }

    @Override
    @Transactional
    public List<ProductImageResponse> saveImages(ProductImageSaveRequest request) {
        Long productId = request.productId();
        List<ProductImageItemRequest> newImages = request.images() != null ? request.images() : List.of();
        
        log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_SAVE_IMAGES_START, productId);
        
        Product product = getProductById(productId);
        
        // Lấy danh sách images hiện tại của product (chưa bị xóa)
        List<ProductImage> existingImages = productImageRepositoryPort.findByProductId(productId);
        
        // Lấy danh sách imageId từ request mới
        Set<Long> newImageIds = newImages.stream()
                .map(ProductImageItemRequest::imageId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        // Xóa các images có trong DB nhưng không có trong request mới (sử dụng bulk update)
        Set<Long> imageIdsToDelete = existingImages.stream()
                .map(ProductImage::getId)
                .filter(imageId -> !newImageIds.contains(imageId))
                .collect(Collectors.toSet());
        
        if (!imageIdsToDelete.isEmpty()) {
            productImageRepositoryPort.softDeleteByIds(imageIdsToDelete);
            log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_SAVE_IMAGES_DELETE, imageIdsToDelete.size());
        }
        
        // Nếu không có images mới, trả về danh sách rỗng
        if (newImages.isEmpty()) {
            log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_SAVE_IMAGES_SUCCESS, 0, productId);
            return List.of();
        }
        
        // Tính max displayOrder từ danh sách images còn lại sau khi xóa
        List<ProductImage> remainingImages = existingImages.stream()
                .filter(img -> !imageIdsToDelete.contains(img.getId()))
                .toList();
        int nextDisplayOrderValue = DisplayOrderUtil.getNextDisplayOrder(remainingImages, ProductImage::getDisplayOrder);
        
        // Tạo hoặc cập nhật các images
        final int[] nextDisplayOrder = {nextDisplayOrderValue};
        List<ProductImage> imagesToSave = newImages.stream()
                .map(itemRequest -> {
                    ProductImage image;
                    boolean isNewImage = itemRequest.imageId() == null;
                    if (!isNewImage) {
                        // Update existing image - tìm trong existingImages trước
                        image = existingImages.stream()
                                .filter(img -> img.getId().equals(itemRequest.imageId()))
                                .findFirst()
                                .orElse(ProductImage.builder().build());
                    } else {
                        // Create new image
                        image = ProductImage.builder().build();
                    }
                    
                    // Map fields from request
                    image.setProduct(product);
                    image.setImageUrl(itemRequest.imageUrl());
                    if (itemRequest.displayOrder() == null) {
                        if (isNewImage) {
                            // Tăng dần displayOrder cho mỗi image mới
                            image.setDisplayOrder(nextDisplayOrder[0]++);
                        }
                    } else {
                        image.setDisplayOrder(itemRequest.displayOrder());
                    }
                    setAltTextIfEmpty(image, product, itemRequest.altText());
                    image.setActive(true);
                    image.setDeleted(false);
                    
                    return image;
                })
                .toList();
        
        List<ProductImage> savedImages = productImageRepositoryPort.saveAll(imagesToSave);
        log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_SAVE_IMAGES_SUCCESS, savedImages.size(), productId);
        return savedImages.stream()
                .map(productImageMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long imageId) {
        log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_DELETE_START, imageId);
        ProductImage image = getById(imageId);
        productImageRepositoryPort.delete(image);
        log.info(ProductImageLogMessages.LOG_PRODUCT_IMAGE_DELETE_SUCCESS, imageId);
    }

    private ProductImage getById(Long imageId) {
        return productImageRepositoryPort.findById(imageId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductImageMessages.MESSAGE_PRODUCT_IMAGE_NOT_FOUND_BY_ID, imageId)));
    }

    private Product getProductById(Long productId) {
        return productService.getById(productId);
    }

    private void setAltTextIfEmpty(ProductImage image, Product product, String altText) {
        if (altText == null || altText.trim().isEmpty()) {
            image.setAltText(ImageAltUtil.generateAltText(product.getName(), " Image"));
        } else {
            image.setAltText(altText);
        }
    }


    private void setDisplayOrderIfNull(ProductImage image, Long productId, Integer displayOrder) {
        if (displayOrder == null) {
            // Lấy max displayOrder hiện tại và +1 để đẩy lên cuối danh sách
            List<ProductImage> existingImages = productImageRepositoryPort.findByProductId(productId);
            int nextDisplayOrder = DisplayOrderUtil.getNextDisplayOrder(existingImages, ProductImage::getDisplayOrder);
            image.setDisplayOrder(nextDisplayOrder);
        } else {
            image.setDisplayOrder(displayOrder);
        }
    }
}


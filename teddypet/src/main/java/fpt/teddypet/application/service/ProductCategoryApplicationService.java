package fpt.teddypet.application.service;

import fpt.teddypet.application.constants.productcategory.ProductCategoryLogMessages;
import fpt.teddypet.application.constants.productcategory.ProductCategoryMessages;
import fpt.teddypet.application.dto.request.ProductCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.ProductCategoryResponse;
import fpt.teddypet.application.dto.response.ProductCategoryNestedResponse;
import fpt.teddypet.application.mapper.ProductCategoryMapper;
import fpt.teddypet.application.port.input.ProductCategoryService;
import fpt.teddypet.application.port.output.ProductCategoryRepositoryPort;
import fpt.teddypet.application.util.ImageAltUtil;
import fpt.teddypet.domain.entity.ProductCategory;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductCategoryApplicationService implements ProductCategoryService {

    private final ProductCategoryRepositoryPort productCategoryRepositoryPort;
    private final ProductCategoryMapper productCategoryMapper;

    @Override
    @Transactional
    public ProductCategoryResponse upsert(ProductCategoryUpsertRequest request) {
        log.info(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_UPSERT_START, request.name());
        
        ProductCategory category;
        boolean isNew = request.categoryId() == null;
        
        if (isNew) {
            category = ProductCategory.builder().build();
            category.setActive(true);
            category.setDeleted(false);
        } else {
            category = getById(request.categoryId());
        }
        
        productCategoryMapper.updateCategoryFromRequest(request, category);
        
        // Set parent if provided
        if (request.parentId() != null) {
            ProductCategory parent = getCategoryById(request.parentId());
            validateNoCircularReference(request.categoryId(), parent);
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
        
        setAltImageIfImageUrlProvided(category, request.name(), request.imageUrl());

        ProductCategory savedCategory = productCategoryRepositoryPort.save(category);
        log.info(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_UPSERT_SUCCESS, savedCategory.getId());
        return productCategoryMapper.toResponse(savedCategory);
    }

    @Override
    public ProductCategoryResponse getByIdResponse(Long categoryId) {
        log.info(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_GET_BY_ID, categoryId);
        ProductCategory category = getById(categoryId);
        return productCategoryMapper.toResponse(category);
    }

    @Override
    public ProductCategory getById(Long categoryId) {
        return productCategoryRepositoryPort.findById(categoryId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductCategoryMessages.MESSAGE_PRODUCT_CATEGORY_NOT_FOUND_BY_ID, categoryId)));
    }

    @Override
    public List<ProductCategoryResponse> getAll() {
        List<ProductCategory> categories = productCategoryRepositoryPort.findAll();
        log.info(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_GET_ALL, categories.size());
        return categories.stream()
                .map(productCategoryMapper::toResponse)
                .toList();
    }

    @Override
    public List<ProductCategoryResponse> getRootCategories() {
        List<ProductCategory> rootCategories = productCategoryRepositoryPort.findRootCategories();
        log.info(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_GET_ROOT_CATEGORIES, rootCategories.size());
        return rootCategories.stream()
                .map(productCategoryMapper::toResponse)
                .toList();
    }

    @Override
    public List<ProductCategoryResponse> getChildCategories(Long parentId) {
        List<ProductCategory> childCategories = productCategoryRepositoryPort.findChildCategories(parentId);
        log.info(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_GET_CHILD_CATEGORIES, parentId, childCategories.size());
        return childCategories.stream()
                .map(productCategoryMapper::toResponse)
                .toList();
    }

    @Override
    public List<Long> findAllDescendantIds(List<Long> categoryIds) {
        return productCategoryRepositoryPort.findAllDescendantIds(categoryIds);
    }

    @Override
    public List<ProductCategoryNestedResponse> getNestedCategories() {
        List<ProductCategory> rootCategories = productCategoryRepositoryPort.findRootCategories();
        log.info(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_GET_NESTED_CATEGORIES, rootCategories.size());
        
        return rootCategories.stream()
                .map(this::buildNestedResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long categoryId) {
        log.info(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_DELETE_START, categoryId);
        ProductCategory category = getById(categoryId);
        category.setDeleted(true);
        category.setActive(false);
        productCategoryRepositoryPort.save(category);
        log.info(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_DELETE_SUCCESS, categoryId);
    }


    private ProductCategory getCategoryById(Long categoryId) {
        return productCategoryRepositoryPort.findByIdAndIsDeletedFalse(categoryId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductCategoryMessages.MESSAGE_PRODUCT_CATEGORY_PARENT_NOT_FOUND, categoryId)));
    }

    private void validateNoCircularReference(Long categoryId, ProductCategory parent) {
        if (categoryId != null && categoryId.equals(parent.getId())) {
            log.warn(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_CIRCULAR_REFERENCE, categoryId);
            throw new IllegalArgumentException(ProductCategoryMessages.MESSAGE_PRODUCT_CATEGORY_CIRCULAR_REFERENCE);
        }
        
        // Check if parent is a descendant of this category
        ProductCategory current = parent;
        while (current.getParent() != null) {
            if (categoryId != null && categoryId.equals(current.getParent().getId())) {
                log.warn(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_CIRCULAR_REFERENCE, categoryId);
                throw new IllegalArgumentException(ProductCategoryMessages.MESSAGE_PRODUCT_CATEGORY_CIRCULAR_REFERENCE);
            }
            current = current.getParent();
        }
    }

    private void setAltImageIfImageUrlProvided(ProductCategory category, String name, String imageUrl) {
        if (imageUrl != null && !imageUrl.trim().isEmpty()) {
            category.setAltImage(ImageAltUtil.generateAltText(name));
        }
    }

    private ProductCategoryNestedResponse buildNestedResponse(ProductCategory category) {
        List<ProductCategory> children = productCategoryRepositoryPort.findChildCategories(category.getId());
        List<ProductCategoryNestedResponse> childrenResponses = children.stream()
                .map(this::buildNestedResponse)
                .toList();
        
        ProductCategoryNestedResponse response = productCategoryMapper.toNestedResponse(category);
        return new ProductCategoryNestedResponse(
                response.categoryId(),
                response.name(),
                response.description(),
                response.imageUrl(),
                response.altImage(),
                response.parentId(),
                response.isActive(),
                response.isDeleted(),
                response.createdAt(),
                response.updatedAt(),
                response.createdBy(),
                response.updatedBy(),
                childrenResponses
        );
    }
}


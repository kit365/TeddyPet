package fpt.teddypet.application.service.products;

import fpt.teddypet.application.constants.products.productcategory.ProductCategoryLogMessages;
import fpt.teddypet.application.constants.products.productcategory.ProductCategoryMessages;
import fpt.teddypet.application.dto.request.products.category.ProductCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryInfo;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryResponse;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryHomeResponse;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryNestedResponse;
import fpt.teddypet.application.mapper.products.ProductCategoryMapper;
import fpt.teddypet.application.port.input.products.ProductCategoryService;
import fpt.teddypet.application.port.output.products.ProductCategoryRepositoryPort;
import fpt.teddypet.application.util.ImageAltUtil;
import fpt.teddypet.application.util.ListUtil;
import fpt.teddypet.application.util.SlugUtil;
import fpt.teddypet.application.util.ValidationUtils;
import fpt.teddypet.domain.entity.ProductCategory;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductCategoryApplicationService implements ProductCategoryService {

    private final ProductCategoryRepositoryPort productCategoryRepositoryPort;
    private final ProductCategoryMapper productCategoryMapper;

    @Override
    @Transactional
    public void upsert(ProductCategoryUpsertRequest request) {
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

        // Generate and validate Slug
        String slug = SlugUtil.toSlug(request.name());
        ValidationUtils.ensureUnique(
                () -> isNew
                        ? productCategoryRepositoryPort.existsBySlug(slug)
                        : productCategoryRepositoryPort.existsBySlugAndIdNot(slug, category.getId()),
                "Slug '" + slug + "' đã tồn tại");
        category.setSlug(slug);

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
    public List<ProductCategory> getAllByIds(List<Long> categoryIds) {
        return productCategoryRepositoryPort.findAllByIds(categoryIds);
    }

    @Override
    public List<ProductCategory> getAllByIdsAndActiveAndDeleted(List<Long> categoryIds, boolean active,
            boolean deleted) {
        return productCategoryRepositoryPort.findAllByIdInAndIsActiveAndIsDeleted(categoryIds, active, deleted);
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
        log.info(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_GET_CHILD_CATEGORIES, parentId,
                childCategories.size());
        return childCategories.stream()
                .map(productCategoryMapper::toResponse)
                .toList();
    }

    @Override
    public List<Long> findAllDescendantIds(List<Long> categoryIds) {
        return productCategoryRepositoryPort.findAllDescendantIds(categoryIds);
    }

    @Override
    @Transactional(readOnly = true)
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

    @Override
    @Transactional
    public int deleteMany(List<Long> ids) {
        log.info("Starting bulk delete for {} ProductCategories", ids.size());
        int count = productCategoryRepositoryPort.softDeleteByIds(ids);
        log.info("Successfully soft deleted {} ProductCategories", count);
        return count;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductCategoryHomeResponse> getLeafCategories() {
        List<ProductCategory> leafCategories = productCategoryRepositoryPort.findLeafCategories();
        log.info("Getting leaf categories (categories without children), found: {}", leafCategories.size());
        return leafCategories.stream()
                .map(productCategoryMapper::toHomeResponse)
                .toList();
    }

    private ProductCategory getCategoryById(Long categoryId) {
        return productCategoryRepositoryPort.findByIdAndIsDeletedFalse(categoryId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(ProductCategoryMessages.MESSAGE_PRODUCT_CATEGORY_PARENT_NOT_FOUND, categoryId)));
    }

    private void validateNoCircularReference(Long categoryId, ProductCategory parent) {
        ValidationUtils.ensure(
                categoryId == null || !categoryId.equals(parent.getId()),
                ProductCategoryMessages.MESSAGE_PRODUCT_CATEGORY_CIRCULAR_REFERENCE);

        if (categoryId != null && categoryId.equals(parent.getId())) {
            log.warn(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_CIRCULAR_REFERENCE, categoryId);
        }

        // Check if parent is a descendant of this category
        ProductCategory current = parent;
        while (current.getParent() != null) {
            if (categoryId != null && categoryId.equals(current.getParent().getId())) {
                log.warn(ProductCategoryLogMessages.LOG_PRODUCT_CATEGORY_CIRCULAR_REFERENCE, categoryId);
                ValidationUtils.ensure(false, ProductCategoryMessages.MESSAGE_PRODUCT_CATEGORY_CIRCULAR_REFERENCE);
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
                childrenResponses);
    }

    @Override
    public ProductCategoryInfo toInfo(ProductCategory category) {
        return toInfo(category, false, true);
    }

    @Override
    public ProductCategoryInfo toInfo(ProductCategory category, boolean includeDeleted) {
        return toInfo(category, includeDeleted, false);
    }

    @Override
    public ProductCategoryInfo toInfo(ProductCategory category, boolean includeDeleted, boolean onlyActive) {
        if (category == null) {
            return null;
        }

        // Kiểm tra bản thân category cha
        if (!includeDeleted && category.isDeleted())
            return null;
        if (onlyActive && !category.isActive())
            return null;

        // Nếu Cha ẩn -> Con ẩn theo.
        if (onlyActive && category.getParent() != null) {
            if (category.getParent().isDeleted() || !category.getParent().isActive()) {
                return null;
            }
        }

        return productCategoryMapper.toInfo(category);
    }

    @Override
    public List<ProductCategoryInfo> toInfos(List<ProductCategory> categories) {
        return toInfos(categories, false, true);

    }

    @Override
    public List<ProductCategoryInfo> toInfos(List<ProductCategory> categories, boolean isDeleted) {
        return toInfos(categories, isDeleted, false);
    }

    @Override
    public List<ProductCategoryInfo> toInfos(List<ProductCategory> categories, boolean includeDeleted,
            boolean onlyActive) {
        return ListUtil.safe(categories).stream()
                .filter(cat -> includeDeleted || !cat.isDeleted())
                .filter(cat -> !onlyActive || cat.isActive())
                // Ưu tiên hiển thị danh mục Cha trước, rồi đến Con, hoặc theo ID
                .sorted(Comparator.comparing(ProductCategory::getId))
                .map(productCategoryMapper::toInfo)
                .toList();
    }

}

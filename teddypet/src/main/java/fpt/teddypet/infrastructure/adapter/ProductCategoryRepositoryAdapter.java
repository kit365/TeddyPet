package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.ProductCategoryRepositoryPort;
import fpt.teddypet.domain.entity.ProductCategory;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductCategoryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class ProductCategoryRepositoryAdapter implements ProductCategoryRepositoryPort {

    private final ProductCategoryRepository productCategoryRepository;

    @Override
    public ProductCategory save(ProductCategory productCategory) {
        return productCategoryRepository.save(productCategory);
    }

    @Override
    public Optional<ProductCategory> findById(Long categoryId) {
        return productCategoryRepository.findByIdAndIsDeletedFalse(categoryId);
    }

    @Override
    public List<ProductCategory> findAll() {
        return productCategoryRepository.findAll().stream()
                .filter(category -> !category.isDeleted())
                .toList();
    }

    @Override
    public Optional<ProductCategory> findByIdAndIsDeletedFalse(Long categoryId) {
        return productCategoryRepository.findByIdAndIsDeletedFalse(categoryId);
    }

    @Override
    public List<ProductCategory> findRootCategories() {
        return productCategoryRepository.findByParentIsNullAndIsDeletedFalse();
    }

    @Override
    public List<ProductCategory> findChildCategories(Long parentId) {
        return productCategoryRepository.findByParentIdAndIsDeletedFalse(parentId);
    }

    @Override
    public List<Long> findAllDescendantIds(List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        Set<Long> allIds = new HashSet<>(categoryIds);

        List<Long> currentLevel = new ArrayList<>(categoryIds);
        while (!currentLevel.isEmpty()) {
            List<Long> nextLevel = new ArrayList<>();
            for (Long categoryId : currentLevel) {
                List<ProductCategory> children = findChildCategories(categoryId);
                for (ProductCategory child : children) {
                    if (!allIds.contains(child.getId())) {
                        allIds.add(child.getId());
                        nextLevel.add(child.getId());
                    }
                }
            }
            currentLevel = nextLevel;
        }
        
        return new ArrayList<>(allIds);
    }

    @Override
    public List<ProductCategory> findAllByIds(List<Long> categoryIds) {

        if (categoryIds == null || categoryIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<ProductCategory> categories = productCategoryRepository.findAllById(categoryIds);

        checkMissingIds(categoryIds, categories);
        return categories;
    }

    @Override
    public List<ProductCategory> findAllByIdInAndIsActiveAndIsDeleted(List<Long> categoryIds, boolean active, boolean deleted) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<ProductCategory> categories = productCategoryRepository.findAllByIdInAndIsActiveAndIsDeleted(categoryIds, active, deleted);

        checkMissingIds(categoryIds, categories);
        return categories;
    }


    private void checkMissingIds(List<Long> requestedIds, List<ProductCategory> foundCategories) {
        List<Long> distinctIds = requestedIds.stream().distinct().toList();

        if (foundCategories.size() != distinctIds.size()) {
            List<Long> foundIds = foundCategories.stream().map(ProductCategory::getId).toList();
            List<Long> missingIds = distinctIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();

            throw new EntityNotFoundException("Không tìm thấy danh mục với ID: " + missingIds);
        }
    }

}


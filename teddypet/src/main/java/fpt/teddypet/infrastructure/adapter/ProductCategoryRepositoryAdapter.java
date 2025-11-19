package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.ProductCategoryRepositoryPort;
import fpt.teddypet.domain.entity.ProductCategory;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductCategoryRepository;
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
        
        // Recursively collect all descendant IDs
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
}


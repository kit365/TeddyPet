package fpt.teddypet.application.port.output;

import fpt.teddypet.domain.entity.ProductCategory;

import java.util.List;
import java.util.Optional;

public interface ProductCategoryRepositoryPort {
    ProductCategory save(ProductCategory productCategory);
    Optional<ProductCategory> findById(Long categoryId);
    List<ProductCategory> findAll();
    Optional<ProductCategory> findByIdAndIsDeletedFalse(Long categoryId);
    List<ProductCategory> findRootCategories();
    List<ProductCategory> findChildCategories(Long parentId);
    /**
     * Get all descendant category IDs (children and all nested children) recursively
     * When filtering products by category, this ensures products in child categories are included
     * 
     * @param categoryIds list of parent category IDs
     * @return list containing original IDs plus all descendant IDs
     */
    List<Long> findAllDescendantIds(List<Long> categoryIds);
}


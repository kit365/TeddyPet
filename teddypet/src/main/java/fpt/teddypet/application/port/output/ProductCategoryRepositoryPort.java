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
}


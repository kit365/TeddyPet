package fpt.teddypet.infrastructure.adapter;

import fpt.teddypet.application.port.output.ProductCategoryRepositoryPort;
import fpt.teddypet.domain.entity.ProductCategory;
import fpt.teddypet.infrastructure.persistence.postgres.repository.ProductCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

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
}


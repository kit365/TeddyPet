package fpt.teddypet.application.port.input.products;

import fpt.teddypet.application.dto.request.products.category.ProductCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryResponse;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryNestedResponse;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryInfo;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryHomeResponse;
import fpt.teddypet.domain.entity.ProductCategory;

import java.util.List;

public interface ProductCategoryService {
    void upsert(ProductCategoryUpsertRequest request);

    ProductCategoryResponse getByIdResponse(Long categoryId);

    ProductCategory getById(Long categoryId);

    List<ProductCategoryResponse> getAll();

    List<ProductCategory> getAllByIds(List<Long> categoryIds);

    List<ProductCategory> getAllByIdsAndActiveAndDeleted(List<Long> categoryIds, boolean isActive, boolean isDeleted);

    List<ProductCategoryResponse> getRootCategories();

    List<ProductCategoryResponse> getChildCategories(Long parentId);

    List<ProductCategoryNestedResponse> getNestedCategories();

    List<Long> findAllDescendantIds(List<Long> categoryIds);

    ProductCategoryInfo toInfo(ProductCategory category);

    ProductCategoryInfo toInfo(ProductCategory category, boolean includeDeleted);

    ProductCategoryInfo toInfo(ProductCategory category, boolean includeDeleted, boolean onlyActive);

    List<ProductCategoryInfo> toInfos(List<ProductCategory> categories);

    List<ProductCategoryInfo> toInfos(List<ProductCategory> categories, boolean onlyActive);

    List<ProductCategoryInfo> toInfos(List<ProductCategory> categories, boolean isDeleted, boolean onlyActive);

    void delete(Long categoryId);

    int deleteMany(List<Long> ids);

    List<ProductCategoryHomeResponse> getLeafCategories();
}

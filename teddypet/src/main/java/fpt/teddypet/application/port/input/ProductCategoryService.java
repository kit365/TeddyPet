package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.ProductCategoryUpsertRequest;
import fpt.teddypet.application.dto.response.ProductCategoryResponse;
import fpt.teddypet.application.dto.response.ProductCategoryNestedResponse;
import fpt.teddypet.domain.entity.ProductCategory;

import java.util.List;

public interface ProductCategoryService {
    ProductCategoryResponse upsert(ProductCategoryUpsertRequest request);
    ProductCategoryResponse getByIdResponse(Long categoryId);
    ProductCategory getById(Long categoryId);
    List<ProductCategoryResponse> getAll();
    List<ProductCategoryResponse> getRootCategories();
    List<ProductCategoryResponse> getChildCategories(Long parentId);
    List<ProductCategoryNestedResponse> getNestedCategories();
    List<Long> findAllDescendantIds(List<Long> categoryIds);
    void delete(Long categoryId);
}


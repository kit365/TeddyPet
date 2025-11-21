package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.product.product.ProductRequest;
import fpt.teddypet.application.dto.request.product.product.ProductSearchRequest;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.dto.response.product.product.ProductDetailResponse;
import fpt.teddypet.domain.entity.Product;

import java.util.List;

public interface ProductService {
    Product getById(Long productId);
    Product getByIdAndIsDeletedFalse(Long productId);
    ProductResponse create(ProductRequest request);
    ProductResponse update(Long productId, ProductRequest request);
    ProductResponse getByIdResponse(Long productId);
    ProductResponse getBySlugResponse(String slug);
    List<ProductResponse> getAll();
    ProductDetailResponse getDetail(Long productId);
    PageResponse<ProductResponse> getAllPaged(ProductSearchRequest request);
    void delete(Long productId);
}


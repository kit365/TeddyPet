package fpt.teddypet.application.port.input;

import fpt.teddypet.application.dto.request.product.ProductRequest;
import fpt.teddypet.application.dto.request.product.ProductSearchRequest;
import fpt.teddypet.application.dto.response.PageResponse;
import fpt.teddypet.application.dto.response.product.ProductResponse;
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
    PageResponse<ProductResponse> getAllPaged(ProductSearchRequest request);
    void delete(Long productId);
}


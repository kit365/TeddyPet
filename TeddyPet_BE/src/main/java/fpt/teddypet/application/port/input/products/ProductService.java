package fpt.teddypet.application.port.input.products;

import fpt.teddypet.application.dto.request.products.product.ProductRequest;
import fpt.teddypet.application.dto.request.products.product.ProductSearchRequest;
import fpt.teddypet.application.dto.request.products.product.ProductHomeSearchRequest;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.dto.response.product.product.ProductDetailResponse;
import fpt.teddypet.application.dto.response.product.product.ProductSuggestionResponse;
import fpt.teddypet.domain.entity.Product;

import java.util.List;

public interface ProductService {
        Product getById(Long productId);

        Product getByIdAndIsDeletedFalse(Long productId);

        void create(ProductRequest request);

        void update(Long productId, ProductRequest request);

        ProductResponse getByIdResponse(Long productId);

        ProductResponse getBySlugResponse(String slug);

        List<ProductResponse> getAll();

        ProductDetailResponse getDetail(Long productId);

        ProductDetailResponse getDetailBySlug(String slug);

        PageResponse<ProductResponse> getAllPaged(ProductSearchRequest request);

        void delete(Long productId);

        // Get products by category slug with pagination and sort
        PageResponse<ProductResponse> getProductsByCategorySlug(String slug, int page, int size, String sortKey,
                        String sortDirection);

        // Get products by brand slug with pagination and sort
        PageResponse<ProductResponse> getProductsByBrandSlug(String slug, int page, int size, String sortKey,
                        String sortDirection);

        // Dynamic search for home page
        PageResponse<ProductResponse> getHomeProducts(ProductHomeSearchRequest request);

        List<ProductSuggestionResponse> getSuggestions(String keyword);
}

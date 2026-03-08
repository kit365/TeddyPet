package fpt.teddypet.presentation.controller.home;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.request.products.product.ProductHomeSearchRequest;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandHomeResponse;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandInfo;
import fpt.teddypet.application.dto.response.product.category.ProductCategoryHomeResponse;
import fpt.teddypet.application.dto.response.product.product.ProductDetailResponse;
import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.dto.response.product.product.ProductSuggestionResponse;
import fpt.teddypet.application.port.input.products.ProductBrandService;
import fpt.teddypet.application.port.input.products.ProductCategoryService;
import fpt.teddypet.application.port.input.products.ProductService;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_HOME)
@Tag(name = "Home", description = "API dành cho trang chủ và khách hàng (không cần token)")
@RequiredArgsConstructor
public class HomeController {

    private final ProductService productService;
    private final ProductCategoryService productCategoryService;
    private final ProductBrandService productBrandService;

    @GetMapping("/products/category/{slug}")
    @Operation(summary = "Lấy sản phẩm theo slug danh mục", description = "Lấy danh sách sản phẩm theo slug danh mục có phân trang và sắp xếp (Public)")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProductsByCategory(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sortKey,
            @RequestParam(required = false) String sortDirection) {
        PageResponse<ProductResponse> response = productService.getProductsByCategorySlug(slug, page, size, sortKey,
                sortDirection);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/brand/{slug}")
    @Operation(summary = "Lấy sản phẩm theo slug thương hiệu", description = "Lấy danh sách sản phẩm theo slug thương hiệu có phân trang và sắp xếp (Public)")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProductsByBrand(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sortKey,
            @RequestParam(required = false) String sortDirection) {
        PageResponse<ProductResponse> response = productService.getProductsByBrandSlug(slug, page, size, sortKey,
                sortDirection);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/tag/{slug}")
    @Operation(summary = "Lấy sản phẩm theo slug tag", description = "Lấy danh sách sản phẩm theo slug tag có phân trang và sắp xếp (Public)")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProductsByTag(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sortKey,
            @RequestParam(required = false) String sortDirection) {
        ProductHomeSearchRequest request = ProductHomeSearchRequest.builder()
                .tagSlugs(List.of(slug))
                .page(page)
                .size(size)
                .sortKey(sortKey)
                .sortDirection(sortDirection)
                .build();
        PageResponse<ProductResponse> response = productService.getHomeProducts(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products")
    @Operation(summary = "Tìm kiếm sản phẩm nâng cao", description = "Lấy danh sách sản phẩm theo nhiều tiêu chí lọc (Public)")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> searchProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<String> categorySlugs,
            @RequestParam(required = false) List<String> brandSlugs,
            @RequestParam(required = false) List<String> tagSlugs,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String sortKey,
            @RequestParam(required = false) String sortDirection) {
        ProductHomeSearchRequest request = ProductHomeSearchRequest.builder()
                .keyword(keyword)
                .categorySlugs(categorySlugs)
                .brandSlugs(brandSlugs)
                .tagSlugs(tagSlugs)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .page(page)
                .size(size)
                .sortKey(sortKey)
                .sortDirection(sortDirection)
                .build();
        PageResponse<ProductResponse> response = productService.getHomeProducts(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/{slug}")
    @Operation(summary = "Lấy chi tiết sản phẩm theo slug", description = "Lấy toàn bộ thông tin chi tiết của một sản phẩm qua slug (Public)")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductDetailBySlug(@PathVariable String slug) {
        ProductDetailResponse response = productService.getDetailBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/search/suggestions")
    @Operation(summary = "Lấy gợi ý tìm kiếm", description = "Lấy danh sách các sản phẩm gợi ý dựa trên từ khóa (Public)")
    public ResponseEntity<ApiResponse<List<ProductSuggestionResponse>>> getSuggestions(@RequestParam String keyword) {
        List<ProductSuggestionResponse> response = productService.getSuggestions(keyword);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/product-categories/leaves")
    @Operation(summary = "Lấy danh mục con (lá) kèm số lượng sản phẩm", description = "Lấy danh sách danh mục không có danh mục con, có thêm số lượng sản phẩm (Public)")
    public ResponseEntity<ApiResponse<List<ProductCategoryHomeResponse>>> getLeafCategories() {
        List<ProductCategoryHomeResponse> responses = productCategoryService.getLeafCategories();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/product-brands")
    @Operation(summary = "Lấy danh sách thương hiệu", description = "Lấy tất cả thương hiệu kèm số lượng sản phẩm (Public)")
    public ResponseEntity<ApiResponse<List<ProductBrandHomeResponse>>> getHomeBrands() {
        List<ProductBrandHomeResponse> responses = productBrandService.getAllHomeBrands();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/product-brands/food-options")
    @Operation(
            summary = "Danh sách nhãn hiệu thức ăn theo loại thú cưng",
            description = "Phục vụ dropdown 'Nhãn hiệu' khi khách chọn mang theo thức ăn (Public)."
    )
    public ResponseEntity<ApiResponse<List<ProductBrandInfo>>> getFoodBrandOptions(
            @RequestParam PetTypeEnum petType
    ) {
        List<ProductBrandInfo> responses = productBrandService.getFoodBrandOptionsByPetType(petType);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}

package fpt.teddypet.presentation.controller.product;

import fpt.teddypet.application.constants.products.product.ProductMessages;
import fpt.teddypet.application.dto.request.products.product.ProductRequest;
import fpt.teddypet.application.dto.request.products.product.ProductSearchRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.common.PageResponse;
import fpt.teddypet.application.dto.response.product.product.ProductResponse;
import fpt.teddypet.application.dto.response.product.product.ProductDetailResponse;
import fpt.teddypet.application.port.input.products.ProductService;
import fpt.teddypet.domain.enums.PetTypeEnum;
import fpt.teddypet.domain.enums.ProductStatusEnum;
import fpt.teddypet.presentation.constants.ApiConstants;
import fpt.teddypet.presentation.validation.RequestParamParser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_PRODUCTS)
@Tag(name = "Sản phẩm", description = "API quản lý sản phẩm")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @Operation(summary = "Tạo sản phẩm", description = "Tạo sản phẩm mới")
    public ResponseEntity<ApiResponse<Void>> create(
            @Valid @RequestBody ProductRequest request) {
        productService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(ProductMessages.MESSAGE_PRODUCT_CREATED_SUCCESS));
    }

    @PutMapping("/{productId}")
    @Operation(summary = "Cập nhật sản phẩm", description = "Cập nhật thông tin sản phẩm")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long productId,
            @Valid @RequestBody ProductRequest request) {
        productService.update(productId, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(ProductMessages.MESSAGE_PRODUCT_UPDATED_SUCCESS));
    }



    @GetMapping("/slug/{slug}")
    @Operation(summary = "Lấy sản phẩm theo slug", description = "Lấy thông tin sản phẩm theo slug")
    public ResponseEntity<ApiResponse<ProductResponse>> getBySlug(@PathVariable String slug) {
        ProductResponse response = productService.getBySlugResponse(slug);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{productId}")
    @Operation(summary = "Lấy chi tiết sản phẩm theo ID", description = "Lấy thông tin chi tiết sản phẩm theo ID")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getDetail(@PathVariable Long productId) {
        ProductDetailResponse response = productService.getDetail(productId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách sản phẩm có phân trang", 
            description = "Lấy danh sách sản phẩm với phân trang, tìm kiếm và bộ lọc. ")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getAllPaged(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sortKey,
            @RequestParam(required = false) String sortDirection,
            // A. Bộ lọc Phân tích dữ liệu
            @RequestParam(required = false) String categoryIds,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) String petTypes,
            @RequestParam(required = false) String ageRangeIds,
            // B. Bộ lọc Trạng thái & Vận hành
            @RequestParam(required = false) ProductStatusEnum status,
            @RequestParam(required = false) String stockStatus,
            @RequestParam(required = false) Integer stockThreshold,
            @RequestParam(required = false) Boolean includeDeletedVariants,
            // C. Bộ lọc Kiểm toán & Chất lượng
            @RequestParam(required = false) String createdAtFrom,
            @RequestParam(required = false) String createdAtTo,
            @RequestParam(required = false) Boolean missingFeaturedImage,
            @RequestParam(required = false) Boolean missingDescription) {
        
        // Parse comma-separated lists using utility class
        List<Long> categoryIdsList = RequestParamParser.parseLongList(categoryIds);
        List<PetTypeEnum> petTypesList = RequestParamParser.parsePetTypeList(petTypes);
        List<Long> ageRangeIdsList = RequestParamParser.parseLongList(ageRangeIds);
        
        // Parse date strings to LocalDateTime (supports both date and datetime format)
        LocalDateTime createdAtFromDateTime = RequestParamParser.parseLocalDateTime(createdAtFrom, false);
        LocalDateTime createdAtToDateTime = RequestParamParser.parseLocalDateTime(createdAtTo, true);
        
        ProductSearchRequest request = new ProductSearchRequest(
                page, size, keyword, sortKey, sortDirection,
                categoryIdsList, brandId, petTypesList, ageRangeIdsList,
                status, stockStatus, stockThreshold, includeDeletedVariants,
                createdAtFromDateTime, createdAtToDateTime, missingFeaturedImage, missingDescription);
        
        PageResponse<ProductResponse> response = productService.getAllPaged(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/all")
    @Operation(summary = "Lấy tất cả sản phẩm", description = "Lấy danh sách tất cả sản phẩm (không phân trang)")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAll() {
        List<ProductResponse> responses = productService.getAll();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{productId}")
    @Operation(summary = "Xóa sản phẩm", description = "Xóa mềm sản phẩm theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long productId) {
        productService.delete(productId);
        return ResponseEntity.ok(ApiResponse.success(ProductMessages.MESSAGE_PRODUCT_DELETED_SUCCESS));
    }
}


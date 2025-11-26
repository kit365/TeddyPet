package fpt.teddypet.presentation.controller.product;

import fpt.teddypet.application.constants.products.productbrand.ProductBrandMessages;
import fpt.teddypet.application.dto.request.products.brand.ProductBrandRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandResponse;
import fpt.teddypet.application.port.input.products.ProductBrandService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_PRODUCT_BRANDS)
@Tag(name = "Thương hiệu sản phẩm", description = "API quản lý thương hiệu sản phẩm")
@RequiredArgsConstructor
public class ProductBrandController {

    private final ProductBrandService productBrandService;

    @PostMapping
    @Operation(summary = "Tạo thương hiệu sản phẩm", description = "Tạo thương hiệu sản phẩm mới")
    public ResponseEntity<ApiResponse<ProductBrandResponse>> create(
            @Valid @RequestBody ProductBrandRequest request) {
        ProductBrandResponse response = productBrandService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(ProductBrandMessages.MESSAGE_PRODUCT_BRAND_CREATED_SUCCESS, response));
    }

    @PutMapping("/{brandId}")
    @Operation(summary = "Cập nhật thương hiệu sản phẩm", description = "Cập nhật thông tin thương hiệu sản phẩm")
    public ResponseEntity<ApiResponse<ProductBrandResponse>> update(
            @PathVariable Long brandId,
            @Valid @RequestBody ProductBrandRequest request) {
        ProductBrandResponse response = productBrandService.update(brandId, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(ProductBrandMessages.MESSAGE_PRODUCT_BRAND_UPDATED_SUCCESS, response));
    }

    @GetMapping("/{brandId}")
    @Operation(summary = "Lấy thương hiệu sản phẩm theo ID", description = "Lấy thông tin thương hiệu sản phẩm theo ID")
    public ResponseEntity<ApiResponse<ProductBrandResponse>> getById(@PathVariable Long brandId) {
        ProductBrandResponse response = productBrandService.getByIdResponse(brandId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả thương hiệu sản phẩm", description = "Lấy danh sách tất cả thương hiệu sản phẩm")
    public ResponseEntity<ApiResponse<List<ProductBrandResponse>>> getAll() {
        List<ProductBrandResponse> responses = productBrandService.getAll();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{brandId}")
    @Operation(summary = "Xóa thương hiệu sản phẩm", description = "Xóa mềm thương hiệu sản phẩm theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long brandId) {
        productBrandService.delete(brandId);
        return ResponseEntity.ok(ApiResponse.success(ProductBrandMessages.MESSAGE_PRODUCT_BRAND_DELETED_SUCCESS));
    }
}


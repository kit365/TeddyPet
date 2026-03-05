package fpt.teddypet.presentation.controller.product;

import fpt.teddypet.application.constants.products.productbrand.ProductBrandMessages;
import fpt.teddypet.application.dto.request.products.brand.ProductBrandRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.product.brand.ProductBrandResponse;
import fpt.teddypet.application.port.input.products.ProductBrandService;
import fpt.teddypet.application.service.products.SimpleEntityExcelService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_PRODUCT_BRANDS)
@Tag(name = "Thương hiệu sản phẩm", description = "API quản lý thương hiệu sản phẩm")
@RequiredArgsConstructor
public class ProductBrandController {

    private final ProductBrandService productBrandService;
    private final SimpleEntityExcelService excelService;

    @PostMapping
    @Operation(summary = "Tạo thương hiệu sản phẩm", description = "Tạo thương hiệu sản phẩm mới")
    public ResponseEntity<ApiResponse<Void>> create(
            @Valid @RequestBody ProductBrandRequest request) {
        productBrandService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(ProductBrandMessages.MESSAGE_PRODUCT_BRAND_CREATED_SUCCESS));
    }

    @PutMapping("/{brandId}")
    @Operation(summary = "Cập nhật thương hiệu sản phẩm", description = "Cập nhật thông tin thương hiệu sản phẩm")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long brandId,
            @Valid @RequestBody ProductBrandRequest request) {
        productBrandService.update(brandId, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(ProductBrandMessages.MESSAGE_PRODUCT_BRAND_UPDATED_SUCCESS));
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

    @DeleteMapping("/batch")
    @Operation(summary = "Xóa nhiều thương hiệu sản phẩm", description = "Xóa mềm nhiều thương hiệu sản phẩm theo danh sách ID")
    public ResponseEntity<ApiResponse<Integer>> deleteMany(@RequestBody List<Long> ids) {
        int count = productBrandService.deleteMany(ids);
        return ResponseEntity
                .ok(ApiResponse.success(ProductBrandMessages.MESSAGE_PRODUCT_BRAND_DELETED_SUCCESS, count));
    }

    // ─── Excel ───────────────────────────────────────────────────────────────

    @GetMapping("/excel/export")
    @Operation(summary = "Xuất danh sách thương hiệu ra Excel")
    public void exportExcel(HttpServletResponse response) {
        excelService.exportBrands(response);
    }

    @GetMapping("/excel/template")
    @Operation(summary = "Tải template Excel để nhập thương hiệu")
    public void downloadTemplate(HttpServletResponse response) {
        excelService.downloadBrandTemplate(response);
    }

    @PostMapping("/excel/import")
    @Operation(summary = "Nhập thương hiệu từ file Excel")
    public ResponseEntity<ApiResponse<SimpleEntityExcelService.ImportResult>> importExcel(
            @RequestParam("file") MultipartFile file) {
        SimpleEntityExcelService.ImportResult result = excelService.importBrands(file);
        return ResponseEntity.ok(ApiResponse.success("Import thương hiệu hoàn tất.", result));
    }
}

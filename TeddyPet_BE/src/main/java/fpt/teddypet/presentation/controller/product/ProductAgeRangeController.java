package fpt.teddypet.presentation.controller.product;

import fpt.teddypet.application.constants.products.productagerange.ProductAgeRangeMessages;
import fpt.teddypet.application.dto.request.products.agerange.ProductAgeRangeRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeResponse;
import fpt.teddypet.application.port.input.products.ProductAgeRangeService;
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
@RequestMapping(ApiConstants.API_PRODUCT_AGE_RANGES)
@Tag(name = "Độ tuổi sản phẩm", description = "API quản lý độ tuổi sản phẩm")
@RequiredArgsConstructor
public class ProductAgeRangeController {

    private final ProductAgeRangeService productAgeRangeService;
    private final SimpleEntityExcelService excelService;

    @PostMapping
    @Operation(summary = "Tạo độ tuổi sản phẩm", description = "Tạo độ tuổi sản phẩm mới")
    public ResponseEntity<ApiResponse<Void>> create(
            @Valid @RequestBody ProductAgeRangeRequest request) {
        productAgeRangeService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(ProductAgeRangeMessages.MESSAGE_PRODUCT_AGE_RANGE_CREATED_SUCCESS));
    }

    @PutMapping("/{ageRangeId}")
    @Operation(summary = "Cập nhật độ tuổi sản phẩm", description = "Cập nhật thông tin độ tuổi sản phẩm")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long ageRangeId,
            @Valid @RequestBody ProductAgeRangeRequest request) {
        productAgeRangeService.update(ageRangeId, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(ProductAgeRangeMessages.MESSAGE_PRODUCT_AGE_RANGE_UPDATED_SUCCESS));
    }

    @GetMapping("/{ageRangeId}")
    @Operation(summary = "Lấy độ tuổi sản phẩm theo ID", description = "Lấy thông tin độ tuổi sản phẩm theo ID")
    public ResponseEntity<ApiResponse<ProductAgeRangeResponse>> getById(@PathVariable Long ageRangeId) {
        ProductAgeRangeResponse response = productAgeRangeService.getByIdResponse(ageRangeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả độ tuổi sản phẩm", description = "Lấy danh sách tất cả độ tuổi sản phẩm. Có thể filter theo isActive và isDeleted")
    public ResponseEntity<ApiResponse<List<ProductAgeRangeResponse>>> getAll(
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Boolean isDeleted) {
        List<ProductAgeRangeResponse> responses = productAgeRangeService.getAll(isActive, isDeleted);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{ageRangeId}")
    @Operation(summary = "Xóa độ tuổi sản phẩm", description = "Xóa mềm độ tuổi sản phẩm theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long ageRangeId) {
        productAgeRangeService.delete(ageRangeId);
        return ResponseEntity
                .ok(ApiResponse.success(ProductAgeRangeMessages.MESSAGE_PRODUCT_AGE_RANGE_DELETED_SUCCESS));
    }

    @DeleteMapping("/batch")
    @Operation(summary = "Xóa nhiều độ tuổi sản phẩm", description = "Xóa mềm nhiều độ tuổi sản phẩm theo danh sách ID")
    public ResponseEntity<ApiResponse<Integer>> deleteMany(@RequestBody List<Long> ids) {
        int count = productAgeRangeService.deleteMany(ids);
        return ResponseEntity
                .ok(ApiResponse.success(ProductAgeRangeMessages.MESSAGE_PRODUCT_AGE_RANGE_DELETED_SUCCESS, count));
    }

    // ─── Excel ───────────────────────────────────────────────────────────────

    @GetMapping("/excel/export")
    @Operation(summary = "Xuất danh sách độ tuổi ra Excel")
    public void exportExcel(HttpServletResponse response) {
        excelService.exportAgeRanges(response);
    }

    @GetMapping("/excel/template")
    @Operation(summary = "Tải template Excel để nhập độ tuổi")
    public void downloadTemplate(HttpServletResponse response) {
        excelService.downloadAgeRangeTemplate(response);
    }

    @PostMapping("/excel/import")
    @Operation(summary = "Nhập độ tuổi từ file Excel")
    public ResponseEntity<ApiResponse<SimpleEntityExcelService.ImportResult>> importExcel(
            @RequestParam("file") MultipartFile file) {
        SimpleEntityExcelService.ImportResult result = excelService.importAgeRanges(file);
        return ResponseEntity.ok(ApiResponse.success("Import độ tuổi hoàn tất.", result));
    }
}

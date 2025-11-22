package fpt.teddypet.presentation.controller.product;

import fpt.teddypet.application.constants.products.productagerange.ProductAgeRangeMessages;
import fpt.teddypet.application.dto.request.product.agerange.ProductAgeRangeRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.product.agerange.ProductAgeRangeResponse;
import fpt.teddypet.application.port.input.ProductAgeRangeService;
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
@RequestMapping(ApiConstants.API_PRODUCT_AGE_RANGES)
@Tag(name = "Độ tuổi sản phẩm", description = "API quản lý độ tuổi sản phẩm")
@RequiredArgsConstructor
public class ProductAgeRangeController {

    private final ProductAgeRangeService productAgeRangeService;

    @PostMapping
    @Operation(summary = "Tạo độ tuổi sản phẩm", description = "Tạo độ tuổi sản phẩm mới")
    public ResponseEntity<ApiResponse<ProductAgeRangeResponse>> create(
            @Valid @RequestBody ProductAgeRangeRequest request) {
        ProductAgeRangeResponse response = productAgeRangeService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(ProductAgeRangeMessages.MESSAGE_PRODUCT_AGE_RANGE_CREATED_SUCCESS, response));
    }

    @PutMapping("/{ageRangeId}")
    @Operation(summary = "Cập nhật độ tuổi sản phẩm", description = "Cập nhật thông tin độ tuổi sản phẩm")
    public ResponseEntity<ApiResponse<ProductAgeRangeResponse>> update(
            @PathVariable Long ageRangeId,
            @Valid @RequestBody ProductAgeRangeRequest request) {
        ProductAgeRangeResponse response = productAgeRangeService.update(ageRangeId, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(ProductAgeRangeMessages.MESSAGE_PRODUCT_AGE_RANGE_UPDATED_SUCCESS, response));
    }

    @GetMapping("/{ageRangeId}")
    @Operation(summary = "Lấy độ tuổi sản phẩm theo ID", description = "Lấy thông tin độ tuổi sản phẩm theo ID")
    public ResponseEntity<ApiResponse<ProductAgeRangeResponse>> getById(@PathVariable Long ageRangeId) {
        ProductAgeRangeResponse response = productAgeRangeService.getByIdResponse(ageRangeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả độ tuổi sản phẩm", description = "Lấy danh sách tất cả độ tuổi sản phẩm")
    public ResponseEntity<ApiResponse<List<ProductAgeRangeResponse>>> getAll() {
        List<ProductAgeRangeResponse> responses = productAgeRangeService.getAll();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{ageRangeId}")
    @Operation(summary = "Xóa độ tuổi sản phẩm", description = "Xóa mềm độ tuổi sản phẩm theo ID")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long ageRangeId) {
        productAgeRangeService.delete(ageRangeId);
        return ResponseEntity.ok(ApiResponse.success(ProductAgeRangeMessages.MESSAGE_PRODUCT_AGE_RANGE_DELETED_SUCCESS));
    }
}


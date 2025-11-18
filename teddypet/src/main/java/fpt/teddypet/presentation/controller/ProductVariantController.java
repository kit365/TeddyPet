package fpt.teddypet.presentation.controller;

import fpt.teddypet.application.constants.productvariant.ProductVariantMessages;
import fpt.teddypet.application.dto.request.ProductVariantSaveRequest;
import fpt.teddypet.application.dto.response.ApiResponse;
import fpt.teddypet.application.dto.response.EnumResponse;
import fpt.teddypet.application.dto.response.ProductVariantResponse;
import fpt.teddypet.application.port.input.ProductVariantService;
import fpt.teddypet.application.util.EnumUtil;
import fpt.teddypet.domain.enums.UnitEnum;
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
@RequestMapping(ApiConstants.API_PRODUCT_VARIANTS)
@Tag(name = "Biến thể sản phẩm", description = "API quản lý biến thể sản phẩm")
@RequiredArgsConstructor
public class ProductVariantController {

    private final ProductVariantService productVariantService;

    @PostMapping
    @Operation(summary = "Tạo hoặc cập nhật biến thể sản phẩm", description = "Tự động tạo mới, cập nhật hoặc xóa biến thể dựa trên danh sách mới. Variants có trong DB nhưng không có trong request sẽ bị xóa.")
    public ResponseEntity<ApiResponse<List<ProductVariantResponse>>> saveVariants(
            @Valid @RequestBody ProductVariantSaveRequest saveRequest) {
        List<ProductVariantResponse> responses = productVariantService.saveVariants(saveRequest);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(ProductVariantMessages.MESSAGE_PRODUCT_VARIANTS_SYNC_SUCCESS, responses));
    }

    @GetMapping("/{variantId}")
    @Operation(summary = "Lấy biến thể sản phẩm theo ID", description = "Lấy thông tin biến thể sản phẩm theo ID")
    public ResponseEntity<ApiResponse<ProductVariantResponse>> getById(@PathVariable Long variantId) {
        ProductVariantResponse response = productVariantService.getByIdResponse(variantId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Lấy tất cả biến thể theo ID sản phẩm", description = "Lấy danh sách tất cả biến thể của một sản phẩm cụ thể")
    public ResponseEntity<ApiResponse<List<ProductVariantResponse>>> getByProductId(@PathVariable Long productId) {
        List<ProductVariantResponse> responses = productVariantService.getByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/enums/units")
    @Operation(summary = "Lấy danh sách unit", description = "Lấy danh sách tất cả các đơn vị có sẵn cho biến thể sản phẩm")
    public ResponseEntity<ApiResponse<EnumResponse>> getUnitEnums() {
        List<String> unitValues = EnumUtil.getAllEnumValues(UnitEnum.class);
        EnumResponse response = new EnumResponse(UnitEnum.class.getSimpleName(), unitValues);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}


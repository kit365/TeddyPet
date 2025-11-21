package fpt.teddypet.presentation.controller;

import fpt.teddypet.application.constants.productattribute.ProductAttributeMessages;
import fpt.teddypet.application.dto.request.product.attribute.ProductAttributeRequest;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.common.EnumOptionResponse;
import fpt.teddypet.application.dto.response.UnitResponse;
import fpt.teddypet.application.dto.response.product.attribute.ProductAttributeResponse;
import fpt.teddypet.application.port.input.ProductAttributeService;
import fpt.teddypet.application.util.EnumUtil;
import fpt.teddypet.domain.enums.AttributeDisplayType;
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

import static fpt.teddypet.application.util.UnitEnumUtil.getUnitsByCategory;

@RestController
@RequestMapping(ApiConstants.API_PRODUCT_ATTRIBUTES)
@Tag(name = "Thuộc tính sản phẩm", description = "API quản lý thuộc tính và giá trị thuộc tính sản phẩm")
@RequiredArgsConstructor
public class ProductAttributeController {

    private final ProductAttributeService productAttributeService;

    @PostMapping
    @Operation(summary = "Tạo thuộc tính sản phẩm", description = "Tạo mới thuộc tính sản phẩm cùng danh sách giá trị (optional)")
    public ResponseEntity<ApiResponse<ProductAttributeResponse>> create(
            @Valid @RequestBody ProductAttributeRequest request) {
        ProductAttributeResponse response = productAttributeService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(ProductAttributeMessages.MESSAGE_PRODUCT_ATTRIBUTE_CREATED_SUCCESS, response));
    }

    @GetMapping("/measurement")
    @Operation(summary = "Lấy đơn vị đo lường (Measurement Unit)", description = "Trả về danh sách đơn vị dùng cho việc định lượng (Kg, Gram, Lít...)")
    public ResponseEntity<ApiResponse<List<UnitResponse>>> getMeasurementUnits() {
        List<UnitResponse> units = getUnitsByCategory(UnitEnum.UnitCategory.MEASUREMENT);
        return ResponseEntity.ok(ApiResponse.success(units));
    }

    @PutMapping("/{attributeId}")
    @Operation(summary = "Cập nhật thuộc tính sản phẩm", description = "Cập nhật thông tin thuộc tính và đồng bộ danh sách giá trị")
    public ResponseEntity<ApiResponse<ProductAttributeResponse>> update(
            @PathVariable Long attributeId,
            @Valid @RequestBody ProductAttributeRequest request) {
        ProductAttributeResponse response = productAttributeService.update(attributeId, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(ProductAttributeMessages.MESSAGE_PRODUCT_ATTRIBUTE_UPDATED_SUCCESS, response));
    }

    @GetMapping("/{attributeId}")
    @Operation(summary = "Lấy thuộc tính sản phẩm theo ID")
    public ResponseEntity<ApiResponse<ProductAttributeResponse>> getById(@PathVariable Long attributeId) {
        ProductAttributeResponse response = productAttributeService.getById(attributeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách thuộc tính sản phẩm")
    public ResponseEntity<ApiResponse<List<ProductAttributeResponse>>> getAll() {
        List<ProductAttributeResponse> responses = productAttributeService.getAll();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{attributeId}")
    @Operation(summary = "Xóa thuộc tính sản phẩm", description = "Xóa mềm thuộc tính sản phẩm")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long attributeId) {
        productAttributeService.delete(attributeId);
        return ResponseEntity.ok(ApiResponse.success(ProductAttributeMessages.MESSAGE_PRODUCT_ATTRIBUTE_DELETED_SUCCESS));
    }

    @GetMapping("/display-types")
    @Operation(summary = "Danh sách kiểu hiển thị thuộc tính")
    public ResponseEntity<ApiResponse<List<EnumOptionResponse>>> getDisplayTypes() {
        List<EnumOptionResponse> responses = EnumUtil.getAllEnums(AttributeDisplayType.class).stream()
                .map(type -> new EnumOptionResponse(type.name(), type.getLabel()))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{attributeId}/supported-units")
    @Operation(summary = "Lấy danh sách đơn vị hỗ trợ của thuộc tính")
    public ResponseEntity<ApiResponse<List<UnitEnum>>> getSupportedUnits(@PathVariable Long attributeId) {
        List<UnitEnum> supportedUnits = productAttributeService.getSupportedUnits(attributeId);
        return ResponseEntity.ok(ApiResponse.success(supportedUnits));
    }
}



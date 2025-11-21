package fpt.teddypet.presentation.controller;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.UnitResponse;
import fpt.teddypet.application.dto.response.product.variant.ProductVariantResponse;
import fpt.teddypet.application.port.input.ProductVariantService;
import fpt.teddypet.application.util.UnitEnumUtil;
import fpt.teddypet.domain.enums.UnitEnum;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_PRODUCT_VARIANTS)
@Tag(name = "Biến thể sản phẩm", description = "API quản lý biến thể sản phẩm")
@RequiredArgsConstructor
public class ProductVariantController {
    private final ProductVariantService productVariantService;

    @GetMapping("/product/{productId}")
    @Operation(summary = "Lấy tất cả biến thể theo ID sản phẩm", description = "Lấy danh sách tất cả biến thể của một sản phẩm cụ thể")
    public ResponseEntity<ApiResponse<List<ProductVariantResponse>>> getByProductId(@PathVariable Long productId) {
        List<ProductVariantResponse> responses = productVariantService.getByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/sales")
    @Operation(summary = "Lấy đơn vị bán hàng", description = "Trả về danh sách đơn vị dùng cho việc bán hàng (Cái, Hộp, Thùng...)")
    public ResponseEntity<ApiResponse<List<UnitResponse>>> getSalesUnits() {
        return ResponseEntity.ok(ApiResponse.success(
                UnitEnumUtil.getUnitsByCategory(UnitEnum.UnitCategory.SALES)
        ));
    }
}


package fpt.teddypet.presentation.controller.shipping;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.shipping.ShippingRuleRequest;
import fpt.teddypet.application.dto.response.shipping.ShippingRuleResponse;
import fpt.teddypet.application.dto.response.shipping.ShippingSuggestionResponse;
import fpt.teddypet.application.port.input.shipping.InternalShippingService;
import fpt.teddypet.presentation.constants.ApiConstants;
import fpt.teddypet.application.constants.shipping.ShippingMessages;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_SHIPPING)
@Tag(name = "Vận chuyển", description = "API quản lý quy tắc và tính phí vận chuyển")
@RequiredArgsConstructor
public class ShippingController {

    private final InternalShippingService internalShippingService;

    // ========== PUBLIC ENDPOINTS ==========

    @GetMapping("/estimate")
    @Operation(summary = "Ước tính phí vận chuyển", description = "Lấy phí vận chuyển cố định theo tỉnh/huyện cho khách hàng")
    public ResponseEntity<ApiResponse<BigDecimal>> getEstimatedFee(
            @RequestParam Integer provinceId,
            @RequestParam(required = false) Integer districtId) {
        BigDecimal fee = internalShippingService.getEstimatedFeeForUser(provinceId, districtId);
        return ResponseEntity.ok(ApiResponse.success(fee));
    }

    // ========== ADMIN ENDPOINTS ==========

    @PostMapping("/rules")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tạo quy tắc vận chuyển", description = "Tạo quy tắc vận chuyển mới (Admin)")
    public ResponseEntity<ApiResponse<ShippingRuleResponse>> createRule(@RequestBody ShippingRuleRequest request) {
        ShippingRuleResponse response = internalShippingService.createRule(request);
        return ResponseEntity.ok(ApiResponse.success(ShippingMessages.SHIPPING_RULE_CREATED, response));
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật quy tắc vận chuyển", description = "Cập nhật quy tắc vận chuyển theo ID (Admin)")
    public ResponseEntity<ApiResponse<ShippingRuleResponse>> updateRule(
            @PathVariable Long id,
            @RequestBody ShippingRuleRequest request) {
        ShippingRuleResponse response = internalShippingService.updateRule(id, request);
        return ResponseEntity.ok(ApiResponse.success(ShippingMessages.SHIPPING_RULE_UPDATED, response));
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa quy tắc vận chuyển", description = "Xóa quy tắc vận chuyển theo ID (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable Long id) {
        internalShippingService.deleteRule(id);
        return ResponseEntity.ok(ApiResponse.success(ShippingMessages.SHIPPING_RULE_DELETED));
    }

    @GetMapping("/rules")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy tất cả quy tắc", description = "Lấy danh sách tất cả quy tắc vận chuyển (Admin)")
    public ResponseEntity<ApiResponse<List<ShippingRuleResponse>>> getAllRules() {
        List<ShippingRuleResponse> rules = internalShippingService.getAllRules();
        return ResponseEntity.ok(ApiResponse.success(rules));
    }

    @GetMapping("/suggestion")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy gợi ý phí vận chuyển", description = "Lấy gợi ý phí vận chuyển dựa trên khoảng cách và tỉnh/thành phố (Admin)")
    public ResponseEntity<ApiResponse<ShippingSuggestionResponse>> getFeeSuggestion(
            @RequestParam double distance,
            @RequestParam Integer provinceId,
            @RequestParam(required = false) BigDecimal orderTotal,
            @RequestParam(required = false, defaultValue = "1.0") Double weight) {
        ShippingSuggestionResponse suggestion = internalShippingService.getFeeSuggestion(distance, provinceId,
                orderTotal, weight);
        return ResponseEntity.ok(ApiResponse.success(suggestion));
    }
}

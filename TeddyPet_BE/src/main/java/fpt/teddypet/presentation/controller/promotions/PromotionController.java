package fpt.teddypet.presentation.controller.promotions;
import fpt.teddypet.application.constants.promotions.PromotionMessages;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.promotions.PromotionRequest;
import fpt.teddypet.application.dto.response.promotions.promotion.PromotionResponse;
import fpt.teddypet.application.port.input.promotions.PromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static fpt.teddypet.presentation.constants.ApiConstants.API_PROMOTION;

@RestController
@RequestMapping(API_PROMOTION)
@Tag(name = "Khuyến mãi", description = "API quản lý khuyến mãi")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tạo khuyến mãi", description = "Tạo khuyến mãi mới (Admin)")
    public ResponseEntity<ApiResponse<PromotionResponse>> create(
            @Valid @RequestBody PromotionRequest request) {
        PromotionResponse response = promotionService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(PromotionMessages.MESSAGE_PROMOTION_CREATED_SUCCESS, response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật khuyến mãi", description = "Cập nhật thông tin khuyến mãi (Admin)")
    public ResponseEntity<ApiResponse<PromotionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody PromotionRequest request) {
        PromotionResponse response = promotionService.update(id, request);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(PromotionMessages.MESSAGE_PROMOTION_UPDATED_SUCCESS, response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy khuyến mãi theo ID", description = "Lấy thông tin khuyến mãi theo ID")
    public ResponseEntity<ApiResponse<PromotionResponse>> getById(@PathVariable UUID id) {
        PromotionResponse response = promotionService.getByIdResponse(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Lấy khuyến mãi theo mã", description = "Lấy thông tin khuyến mãi theo mã code")
    public ResponseEntity<ApiResponse<PromotionResponse>> getByCode(@PathVariable String code) {
        PromotionResponse response = promotionService.getByCodeResponse(code);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả khuyến mãi", description = "Lấy danh sách tất cả khuyến mãi")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getAll() {
        List<PromotionResponse> responses = promotionService.getAll();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/active")
    @Operation(summary = "Lấy khuyến mãi đang hoạt động", description = "Lấy danh sách khuyến mãi đang hoạt động")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getAllActive() {
        List<PromotionResponse> responses = promotionService.getAllActive();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa khuyến mãi", description = "Xóa mềm khuyến mãi theo ID (Admin)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        promotionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(PromotionMessages.MESSAGE_PROMOTION_DELETED_SUCCESS));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Kích hoạt khuyến mãi", description = "Kích hoạt khuyến mãi (Admin)")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable UUID id) {
        promotionService.activate(id);
        return ResponseEntity.ok(ApiResponse.success(PromotionMessages.MESSAGE_PROMOTION_ACTIVATED_SUCCESS));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Vô hiệu hóa khuyến mãi", description = "Vô hiệu hóa khuyến mãi (Admin)")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        promotionService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success(PromotionMessages.MESSAGE_PROMOTION_DEACTIVATED_SUCCESS));
    }
}

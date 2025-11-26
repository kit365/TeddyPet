package fpt.teddypet.presentation.controller.promotions;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.promotions.promotion_usage.PromotionUsageResponse;
import fpt.teddypet.application.port.input.promotions.PromotionUsageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;
import static fpt.teddypet.presentation.constants.ApiConstants.PROMOTION_USAGES_BASE;

@RestController
@RequestMapping(PROMOTION_USAGES_BASE)
@Tag(name = "Lịch sử sử dụng khuyến mãi", description = "API quản lý lịch sử sử dụng khuyến mãi")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PromotionUsageController {

    private final PromotionUsageService promotionUsageService;

    @GetMapping("/{id}")
    @Operation(summary = "Lấy lịch sử sử dụng theo ID", description = "Lấy thông tin lịch sử sử dụng khuyến mãi theo ID (Admin)")
    public ResponseEntity<ApiResponse<PromotionUsageResponse>> getById(@PathVariable UUID id) {
        PromotionUsageResponse response = promotionUsageService.getByIdResponse(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Lấy lịch sử sử dụng của user", description = "Lấy danh sách lịch sử sử dụng khuyến mãi của user (Admin)")
    public ResponseEntity<ApiResponse<List<PromotionUsageResponse>>> getByUserId(@PathVariable UUID userId) {
        List<PromotionUsageResponse> responses = promotionUsageService.getByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/promotion/{promotionId}")
    @Operation(summary = "Lấy lịch sử sử dụng của khuyến mãi", description = "Lấy danh sách lịch sử sử dụng của một khuyến mãi (Admin)")
    public ResponseEntity<ApiResponse<List<PromotionUsageResponse>>> getByPromotionId(@PathVariable UUID promotionId) {
        List<PromotionUsageResponse> responses = promotionUsageService.getByPromotionId(promotionId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/check/{userId}/{promotionId}")
    @Operation(summary = "Kiểm tra user có thể sử dụng khuyến mãi", description = "Kiểm tra xem user có thể sử dụng khuyến mãi hay không (Admin)")
    public ResponseEntity<ApiResponse<Boolean>> canUserUsePromotion(
            @PathVariable UUID userId,
            @PathVariable UUID promotionId) {
        boolean canUse = promotionUsageService.canUserUsePromotion(userId, promotionId);
        return ResponseEntity.ok(ApiResponse.success(canUse));
    }

    @GetMapping("/count/{userId}/{promotionId}")
    @Operation(summary = "Lấy số lần user đã sử dụng khuyến mãi", description = "Lấy số lần user đã sử dụng một khuyến mãi cụ thể (Admin)")
    public ResponseEntity<ApiResponse<Integer>> getUserPromotionUsageCount(
            @PathVariable UUID userId,
            @PathVariable UUID promotionId) {
        Integer count = promotionUsageService.getUserPromotionUsageCount(userId, promotionId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}

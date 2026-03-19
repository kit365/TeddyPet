package fpt.teddypet.presentation.controller.banks;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.banks.SetDefaultBankInformationRequest;
import fpt.teddypet.application.dto.request.banks.UpsertBankInformationRequest;
import fpt.teddypet.application.dto.request.banks.VerifyBankInformationRequest;
import fpt.teddypet.application.dto.response.banks.BankInformationResponse;
import fpt.teddypet.application.port.input.banks.BankInformationService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_BANK_INFORMATION)
@RequiredArgsConstructor
@Tag(name = "Bank Information", description = "API quản lý thông tin ngân hàng")
public class BankInformationController {

    private final BankInformationService bankInformationService;

    @GetMapping("/me")
    @Operation(summary = "Danh sách bank information của tôi")
    public ResponseEntity<ApiResponse<List<BankInformationResponse>>> getMyBanks() {
        List<BankInformationResponse> data = bankInformationService.getMyBanks();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/me")
    @Operation(summary = "Tạo bank information cho tôi (cần verify)")
    public ResponseEntity<ApiResponse<BankInformationResponse>> createMyBank(
            @Valid @RequestBody UpsertBankInformationRequest request) {
        BankInformationResponse data = bankInformationService.createMyBank(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data));
    }

    @PutMapping("/me/{id}")
    @Operation(summary = "Cập nhật bank information của tôi")
    public ResponseEntity<ApiResponse<BankInformationResponse>> updateMyBank(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpsertBankInformationRequest request) {
        BankInformationResponse data = bankInformationService.updateMyBank(id, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/me/{id}/default")
    @Operation(summary = "Set/unset bank default của tôi")
    public ResponseEntity<ApiResponse<BankInformationResponse>> setMyDefault(
            @PathVariable("id") Long id,
            @Valid @RequestBody SetDefaultBankInformationRequest request) {
        BankInformationResponse data = bankInformationService.setMyDefault(id, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/booking/code/{bookingCode}")
    @Operation(summary = "Khách vãng lai nhập bank info cho booking")
    public ResponseEntity<ApiResponse<BankInformationResponse>> createGuestBankForBooking(
            @PathVariable String bookingCode,
            @Valid @RequestBody UpsertBankInformationRequest request) {
        BankInformationResponse data = bankInformationService.createGuestBankForBookingCode(bookingCode, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data));
    }

    @PostMapping("/order/code/{orderCode}")
    @Operation(summary = "Khách vãng lai nhập bank info cho đơn hàng (để hoàn tiền)")
    public ResponseEntity<ApiResponse<BankInformationResponse>> createGuestBankForOrder(
            @PathVariable String orderCode,
            @Valid @RequestBody UpsertBankInformationRequest request) {
        BankInformationResponse data = bankInformationService.createGuestBankForOrderCode(orderCode, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data));
    }

    @GetMapping("/booking/code/{bookingCode}")
    @Operation(summary = "Lấy bank info theo booking code (nếu có)")
    public ResponseEntity<ApiResponse<BankInformationResponse>> getBankForBooking(
            @PathVariable String bookingCode) {
        BankInformationResponse data = bankInformationService.getBankForBookingCode(bookingCode);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/guest-by-email")
    @Operation(summary = "Lấy thông tin chuyển khoản đã lưu theo email khách (guest) - dùng để pre-fill khi order/booking")
    public ResponseEntity<ApiResponse<BankInformationResponse>> getBankByGuestEmail(
            @RequestParam String email) {
        BankInformationResponse data = bankInformationService.getBankByGuestEmail(email);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Lấy bank info theo orderId (public khi tra cứu đơn; admin cũng dùng)")
    public ResponseEntity<ApiResponse<BankInformationResponse>> getBankForOrder(
            @PathVariable String orderId
    ) {
        BankInformationResponse data = bankInformationService.getBankForOrderId(orderId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    @Operation(summary = "[Staff/Admin] Verify bank information")
    public ResponseEntity<ApiResponse<BankInformationResponse>> verify(
            @PathVariable("id") Long id,
            @Valid @RequestBody VerifyBankInformationRequest request) {
        BankInformationResponse data = bankInformationService.verifyBank(id, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    @Operation(summary = "[Staff/Admin] Danh sách bank information để xác thực")
    public ResponseEntity<ApiResponse<List<BankInformationResponse>>> getAllForVerify(
            @RequestParam(required = false) Boolean verified
    ) {
        List<BankInformationResponse> data = bankInformationService.getAllForVerify(verified);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}


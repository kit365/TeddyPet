package fpt.teddypet.presentation.controller.admin;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.bookings.UpsertBookingDepositRefundPolicyRequest;
import fpt.teddypet.application.dto.response.bookings.BookingDepositRefundPolicyResponse;
import fpt.teddypet.application.port.input.bookings.BookingDepositRefundPolicyAdminService;
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
@RequestMapping(ApiConstants.API_ADMIN_BOOKING_DEPOSIT_REFUND_POLICIES)
@RequiredArgsConstructor
@Tag(name = "Booking Deposit Refund Policies (Admin)", description = "API quản lý chính sách hoàn cọc (admin)")
public class BookingDepositRefundPolicyAdminController {

    private final BookingDepositRefundPolicyAdminService bookingDepositRefundPolicyAdminService;

    @GetMapping
    @Operation(summary = "Danh sách chính sách hoàn cọc (admin)")
    public ResponseEntity<ApiResponse<List<BookingDepositRefundPolicyResponse>>> getAll() {
        List<BookingDepositRefundPolicyResponse> data = bookingDepositRefundPolicyAdminService.getAll();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping
    @Operation(summary = "Tạo chính sách hoàn cọc mới")
    public ResponseEntity<ApiResponse<BookingDepositRefundPolicyResponse>> create(
            @Valid @RequestBody UpsertBookingDepositRefundPolicyRequest request) {
        BookingDepositRefundPolicyResponse data = bookingDepositRefundPolicyAdminService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(data));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật chính sách hoàn cọc")
    public ResponseEntity<ApiResponse<BookingDepositRefundPolicyResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpsertBookingDepositRefundPolicyRequest request) {
        BookingDepositRefundPolicyResponse data = bookingDepositRefundPolicyAdminService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa (soft delete) chính sách hoàn cọc")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        bookingDepositRefundPolicyAdminService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

package fpt.teddypet.presentation.controller.admin;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.response.bookings.BookingDepositRefundPolicyResponse;
import fpt.teddypet.application.port.input.bookings.BookingDepositRefundPolicyAdminService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}


package fpt.teddypet.presentation.controller.admin;

import fpt.teddypet.application.dto.request.bookings.AdminHandleBookingRefundRequest;
import fpt.teddypet.application.dto.response.bookings.BookingRefundResponse;
import fpt.teddypet.application.service.bookings.BookingRefundAdminApplicationService;
import fpt.teddypet.application.dto.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/booking-refunds")
@RequiredArgsConstructor
public class BookingRefundAdminController {

    private final BookingRefundAdminApplicationService service;

    @PutMapping("/{refundId}/handle")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<BookingRefundResponse>> handleRefundRequest(
            @PathVariable Long refundId,
            @Valid @RequestBody AdminHandleBookingRefundRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.handleRefundRequest(refundId, request)));
    }

    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<BookingRefundResponse>>> getRefundRequests(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(ApiResponse.success(service.getAllForBooking(bookingId)));
    }
}

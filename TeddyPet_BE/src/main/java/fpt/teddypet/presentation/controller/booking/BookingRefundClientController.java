package fpt.teddypet.presentation.controller.booking;

import fpt.teddypet.application.dto.request.bookings.BookingRefundRequest;
import fpt.teddypet.application.dto.response.bookings.BookingRefundResponse;
import fpt.teddypet.application.service.bookings.BookingRefundClientApplicationService;
import fpt.teddypet.application.dto.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/booking-refunds")
@RequiredArgsConstructor
public class BookingRefundClientController {

    private final BookingRefundClientApplicationService service;

    @PostMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<BookingRefundResponse>> createRefundRequest(
            @PathVariable Long bookingId,
            @Valid @RequestBody BookingRefundRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.createRefundRequest(bookingId, request)));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<List<BookingRefundResponse>>> getMyRefundRequests(
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(ApiResponse.success(service.getMyRefundRequests(bookingId)));
    }
}

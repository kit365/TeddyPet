package fpt.teddypet.presentation.controller.booking;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.request.bookings.ClientServiceReviewUpsertRequest;
import fpt.teddypet.application.dto.request.bookings.UpdateBookingContactRequest;
import fpt.teddypet.application.dto.request.bookings.ClientCancelBookingRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;
import fpt.teddypet.application.dto.response.bookings.BookingRefundResponse;
import fpt.teddypet.application.dto.response.bookings.ClientBookingDetailResponse;
import fpt.teddypet.application.port.input.bookings.BookingClientService;
import fpt.teddypet.application.service.bookings.BookingRefundClientApplicationService;
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
@RequestMapping(ApiConstants.API_BOOKINGS)
@RequiredArgsConstructor
@Tag(name = "Booking (Client)", description = "API cho khách hàng đặt lịch dịch vụ")
public class BookingClientController {

    private final BookingClientService bookingClientService;
    private final BookingRefundClientApplicationService bookingRefundClientApplicationService;

    @PostMapping
    @Operation(summary = "Tạo booking từ form đặt lịch của khách hàng (client)")
    public ResponseEntity<ApiResponse<CreateBookingResponse>> createBooking(
            @Valid @RequestBody CreateBookingRequest request) {
        CreateBookingResponse response = bookingClientService.createBooking(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt lịch thành công", response));
    }

    @GetMapping("/code/{bookingCode}")
    @Operation(summary = "Tra cứu đơn đặt lịch theo mã (client)")
    public ResponseEntity<ApiResponse<ClientBookingDetailResponse>> getByCode(@PathVariable String bookingCode) {
        ClientBookingDetailResponse data = bookingClientService.getClientBookingDetailByCode(bookingCode);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/code/{bookingCode}/refunds")
    @Operation(summary = "Lịch sử yêu cầu hoàn tiền theo mã đặt lịch (public, không cần đăng nhập)")
    public ResponseEntity<ApiResponse<List<BookingRefundResponse>>> listRefundsByBookingCode(
            @PathVariable String bookingCode) {
        List<BookingRefundResponse> data = bookingRefundClientApplicationService.listRefundsByBookingCodePublic(bookingCode);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PutMapping("/code/{bookingCode}/contact")
    @Operation(summary = "Cập nhật thông tin liên hệ của đơn đặt lịch (client)")
    public ResponseEntity<ApiResponse<ClientBookingDetailResponse>> updateContact(
            @PathVariable String bookingCode,
            @Valid @RequestBody UpdateBookingContactRequest request) {
        ClientBookingDetailResponse data = bookingClientService.updateBookingContact(bookingCode, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin liên hệ thành công", data));
    }

    @PostMapping("/code/{bookingCode}/cancel")
    @Operation(summary = "Yêu cầu hủy đơn đặt lịch (client)")
    public ResponseEntity<ApiResponse<ClientBookingDetailResponse>> cancelBooking(
            @PathVariable String bookingCode,
            @RequestBody ClientCancelBookingRequest request) {
        ClientBookingDetailResponse data = bookingClientService.cancelBooking(bookingCode, request);
        return ResponseEntity.ok(ApiResponse.success("Hủy đơn thành công", data));
    }

    @PutMapping("/code/{bookingCode}/services/{bookingPetServiceId}/review")
    @Operation(summary = "Khách hàng đánh giá dịch vụ booking_pet_service")
    public ResponseEntity<ApiResponse<ClientBookingDetailResponse>> upsertServiceReview(
            @PathVariable String bookingCode,
            @PathVariable Long bookingPetServiceId,
            @Valid @RequestBody ClientServiceReviewUpsertRequest request) {
        ClientBookingDetailResponse data = bookingClientService.upsertServiceReview(bookingCode, bookingPetServiceId, request);
        return ResponseEntity.ok(ApiResponse.success("Đánh giá dịch vụ thành công", data));
    }
}

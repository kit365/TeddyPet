package fpt.teddypet.presentation.controller.admin;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.bookings.AddChargeItemRequest;
import fpt.teddypet.application.dto.request.bookings.ApproveBookingCancelRequest;
import fpt.teddypet.application.dto.request.bookings.ApproveChargeItemRequest;
import fpt.teddypet.application.dto.request.bookings.CreateBookingPaymentTransactionRequest;
import fpt.teddypet.application.dto.response.bookings.AdminBookingListItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceItemResponse;
import fpt.teddypet.application.dto.response.bookings.AdminBookingPetServiceResponse;
import fpt.teddypet.application.dto.response.bookings.BookingPaymentTransactionResponse;
import fpt.teddypet.application.dto.response.bookings.BookingTransactionItemResponse;
import fpt.teddypet.application.port.input.bookings.BookingAdminService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(ApiConstants.API_ADMIN_BOOKINGS)
@RequiredArgsConstructor
@Tag(name = "Booking (Admin)", description = "API quản lý danh sách đặt lịch cho admin")
public class BookingAdminController {

    private final BookingAdminService bookingAdminService;

    @GetMapping
    @Operation(summary = "Danh sách booking (admin)")
    public ResponseEntity<ApiResponse<List<AdminBookingListItemResponse>>> getAll() {
        List<AdminBookingListItemResponse> data = bookingAdminService.getAll();
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Thông tin booking (admin)")
    public ResponseEntity<ApiResponse<AdminBookingListItemResponse>> getBooking(@PathVariable Long id) {
        AdminBookingListItemResponse data = bookingAdminService.getBookingBasic(id);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{id}/pets")
    @Operation(summary = "Danh sách thú cưng trong booking (admin)")
    public ResponseEntity<ApiResponse<List<AdminBookingPetResponse>>> getPets(@PathVariable Long id) {
        List<AdminBookingPetResponse> data = bookingAdminService.getPets(id);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{bookingId}/pets/{petId}")
    @Operation(summary = "Chi tiết thú cưng trong booking (admin)")
    public ResponseEntity<ApiResponse<AdminBookingPetResponse>> getPetDetail(
            @PathVariable Long bookingId,
            @PathVariable Long petId
    ) {
        AdminBookingPetResponse data = bookingAdminService.getPetDetail(bookingId, petId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{bookingId}/pets/{petId}/services/{serviceId}")
    @Operation(summary = "Chi tiết dịch vụ của thú cưng trong booking (admin)")
    public ResponseEntity<ApiResponse<AdminBookingPetServiceResponse>> getServiceDetail(
            @PathVariable Long bookingId,
            @PathVariable Long petId,
            @PathVariable Long serviceId
    ) {
        AdminBookingPetServiceResponse data = bookingAdminService.getServiceDetail(bookingId, petId, serviceId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/{bookingId}/pets/{petId}/services/{bookingPetServiceId}/items")
    @Operation(summary = "Thêm dịch vụ additional charge vào booking_pet_service (nhân viên)")
    public ResponseEntity<ApiResponse<AdminBookingPetServiceItemResponse>> addChargeItem(
            @PathVariable Long bookingId,
            @PathVariable Long petId,
            @PathVariable Long bookingPetServiceId,
            @Valid @RequestBody AddChargeItemRequest request
    ) {
        AdminBookingPetServiceItemResponse data = bookingAdminService.addChargeItem(bookingId, petId, bookingPetServiceId, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/{bookingId}/pets/{petId}/services/{bookingPetServiceId}/items/{itemId}/approve")
    @Operation(summary = "Xác nhận khách hàng đã đồng ý additional charge")
    public ResponseEntity<ApiResponse<AdminBookingPetServiceItemResponse>> approveChargeItem(
            @PathVariable Long bookingId,
            @PathVariable Long petId,
            @PathVariable Long bookingPetServiceId,
            @PathVariable Long itemId,
            @Valid @RequestBody ApproveChargeItemRequest request
    ) {
        AdminBookingPetServiceItemResponse data = bookingAdminService.approveChargeItem(bookingId, petId, bookingPetServiceId, itemId, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/{bookingId}/cancel-request")
    @Operation(summary = "Duyệt / từ chối yêu cầu hủy đơn đặt lịch (client)")
    public ResponseEntity<ApiResponse<AdminBookingListItemResponse>> approveOrRejectCancelRequest(
            @PathVariable Long bookingId,
            @Valid @RequestBody ApproveBookingCancelRequest request
    ) {
        AdminBookingListItemResponse data = bookingAdminService.approveOrRejectCancelRequest(bookingId, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/{bookingId}/confirm-ready")
    @Operation(summary = "Xác nhận thú cưng và cập nhật trạng thái đơn thành READY")
    public ResponseEntity<ApiResponse<AdminBookingListItemResponse>> confirmReadyToWork(
            @PathVariable Long bookingId,
            @Valid @RequestBody fpt.teddypet.application.dto.request.bookings.ConfirmBookingReadyRequest request
    ) {
        AdminBookingListItemResponse data = bookingAdminService.confirmReadyToWork(bookingId, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/{bookingId}/confirm-payment")
    @Operation(summary = "Xác nhận thanh toán đầy đủ và set payment method (chỉ cho COMPLETED bookings)")
    public ResponseEntity<ApiResponse<AdminBookingListItemResponse>> confirmFullPayment(
            @PathVariable Long bookingId,
            @Valid @RequestBody fpt.teddypet.application.dto.request.bookings.ConfirmFullPaymentRequest request
    ) {
        AdminBookingListItemResponse data = bookingAdminService.confirmFullPayment(bookingId, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/{bookingId}/check-in")
    @Operation(summary = "Check-in: ghi nhận thời gian vào (booking_check_in_date)")
    public ResponseEntity<ApiResponse<AdminBookingListItemResponse>> checkIn(@PathVariable Long bookingId) {
        AdminBookingListItemResponse data = bookingAdminService.checkIn(bookingId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/{bookingId}/check-out")
    @Operation(summary = "Check-out: ghi nhận thời gian ra (booking_check_out_date)")
    public ResponseEntity<ApiResponse<AdminBookingListItemResponse>> checkOut(@PathVariable Long bookingId) {
        AdminBookingListItemResponse data = bookingAdminService.checkOut(bookingId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{bookingId}/payment-transactions")
    @Operation(summary = "Danh sách giao dịch thanh toán hóa đơn theo booking")
    public ResponseEntity<ApiResponse<List<BookingPaymentTransactionResponse>>> getPaymentTransactions(@PathVariable Long bookingId) {
        List<BookingPaymentTransactionResponse> data = bookingAdminService.getPaymentTransactions(bookingId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping("/{bookingId}/transactions")
    @Operation(summary = "Danh sách giao dịch chi tiết: cọc + thanh toán hóa đơn, sắp xếp theo thời gian")
    public ResponseEntity<ApiResponse<List<BookingTransactionItemResponse>>> getBookingTransactions(@PathVariable Long bookingId) {
        List<BookingTransactionItemResponse> data = bookingAdminService.getBookingTransactions(bookingId);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/{bookingId}/payment-transactions")
    @Operation(summary = "Thêm một giao dịch thanh toán (tiền mặt / chuyển khoản / VietQR). Khi status=COMPLETED sẽ cập nhật paid_amount, remaining_amount và payment_status của booking.")
    public ResponseEntity<ApiResponse<BookingPaymentTransactionResponse>> addPaymentTransaction(
            @PathVariable Long bookingId,
            @Valid @RequestBody CreateBookingPaymentTransactionRequest request
    ) {
        BookingPaymentTransactionResponse data = bookingAdminService.addPaymentTransaction(bookingId, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/{bookingId}/internal-notes")
    @Operation(summary = "Cập nhật ghi chú nội bộ của booking (admin)")
    public ResponseEntity<ApiResponse<AdminBookingListItemResponse>> updateInternalNotes(
            @PathVariable Long bookingId,
            @Valid @RequestBody fpt.teddypet.application.dto.request.bookings.UpdateBookingInternalNotesRequest request
    ) {
        AdminBookingListItemResponse data = bookingAdminService.updateInternalNotes(bookingId, request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}


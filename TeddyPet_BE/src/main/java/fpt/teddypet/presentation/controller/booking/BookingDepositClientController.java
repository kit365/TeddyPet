package fpt.teddypet.presentation.controller.booking;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingDepositIntentResponse;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;
import fpt.teddypet.application.port.input.bookings.BookingDepositClientService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_BOOKINGS + "/deposit-intent")
@RequiredArgsConstructor
@Tag(name = "Booking Deposits (Client)", description = "Giữ chỗ 5 phút trước khi thanh toán cọc")
public class BookingDepositClientController {

        private final BookingDepositClientService bookingDepositClientService;

        @PostMapping
        @Operation(summary = "Tạo deposit intent (giữ phòng/khung giờ 5 phút)")
        public ResponseEntity<ApiResponse<CreateBookingDepositIntentResponse>> createDepositIntent(
                        @RequestBody CreateBookingRequest request) {
                CreateBookingDepositIntentResponse response = bookingDepositClientService.createDepositIntent(request);
                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(ApiResponse.success(
                                                "Đã giữ chỗ trong 5 phút. Vui lòng thanh toán cọc để hoàn tất.",
                                                response));
        }

        @PostMapping("/{depositId}/confirm")
        @Operation(summary = "Xác nhận thanh toán cọc (giả lập) và tạo booking thật từ giữ chỗ")
        public ResponseEntity<ApiResponse<CreateBookingResponse>> confirmDepositAndCreateBooking(
                        @PathVariable Long depositId,
                        @org.springframework.web.bind.annotation.RequestParam(required = false) String paymentMethod) {
                CreateBookingResponse response = bookingDepositClientService.confirmDepositAndCreateBooking(depositId,
                                paymentMethod);
                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Thanh toán cọc thành công. Đã tạo booking.", response));
        }
}

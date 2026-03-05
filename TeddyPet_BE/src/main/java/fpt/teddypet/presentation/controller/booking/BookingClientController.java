package fpt.teddypet.presentation.controller.booking;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;
import fpt.teddypet.application.port.input.bookings.BookingClientService;
import fpt.teddypet.presentation.constants.ApiConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_BOOKINGS)
@RequiredArgsConstructor
@Tag(name = "Booking (Client)", description = "API cho khách hàng đặt lịch dịch vụ")
public class BookingClientController {

    private final BookingClientService bookingClientService;

    @PostMapping
    @Operation(summary = "Tạo booking từ form đặt lịch của khách hàng (client)")
    public ResponseEntity<ApiResponse<CreateBookingResponse>> createBooking(
            @Valid @RequestBody CreateBookingRequest request
    ) {
        CreateBookingResponse response = bookingClientService.createBooking(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt lịch thành công", response));
    }
}


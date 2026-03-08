package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;

public interface BookingClientService {

    /**
     * Tạo booking từ form khách hàng (client).
     */
    CreateBookingResponse createBooking(CreateBookingRequest request);
}


package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;
import fpt.teddypet.application.dto.response.bookings.ClientBookingDetailResponse;

public interface BookingClientService {

    /**
     * Tạo booking từ form khách hàng (client).
     */
    CreateBookingResponse createBooking(CreateBookingRequest request);

    /**
     * Tạo booking nhưng KHÔNG tăng currentBookings cho time_slots.
     * Dùng cho flow đã giữ chỗ trước (Booking_Deposits) để tránh double-count.
     */
    CreateBookingResponse createBookingWithoutTimeSlotIncrement(CreateBookingRequest request);

    /**
     * Tra cứu thông tin booking cho khách (theo bookingCode).
     */
    ClientBookingDetailResponse getClientBookingDetailByCode(String bookingCode);
}


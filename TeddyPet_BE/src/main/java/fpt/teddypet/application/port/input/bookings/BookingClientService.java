package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.request.bookings.ClientServiceReviewUpsertRequest;
import fpt.teddypet.application.dto.request.bookings.UpdateBookingContactRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;
import fpt.teddypet.application.dto.response.bookings.ClientBookingDetailResponse;

import java.time.LocalDate;
import java.util.List;

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

    /**
     * Cập nhật thông tin liên hệ của booking (tên, email, sdt, địa chỉ).
     */
    ClientBookingDetailResponse updateBookingContact(String bookingCode, UpdateBookingContactRequest request);

    /**
     * Khách hàng gửi yêu cầu hủy booking
     */
    ClientBookingDetailResponse cancelBooking(String bookingCode, fpt.teddypet.application.dto.request.bookings.ClientCancelBookingRequest request);

    /**
     * Khách hàng đánh giá từng booking_pet_service sau khi check-out.
     */
    ClientBookingDetailResponse upsertServiceReview(String bookingCode, Long bookingPetServiceId, ClientServiceReviewUpsertRequest request);

    /**
     * Danh sách roomId đã có đặt phòng trùng khoảng ngày (dùng cho sơ đồ phòng làm mờ phòng đã đặt).
     */
    List<Long> getBookedRoomIds(LocalDate checkIn, LocalDate checkOut);
}

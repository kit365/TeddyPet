package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingDepositIntentResponse;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;

public interface BookingDepositClientService {

    CreateBookingDepositIntentResponse createDepositIntent(CreateBookingRequest request);

    /**
     * Sau khi thanh toán cọc thành công: tạo booking thật từ booking_draft
     * và đánh dấu deposit đã thanh toán.
     */
    CreateBookingResponse confirmDepositAndCreateBooking(Long depositId, String paymentMethod);
}

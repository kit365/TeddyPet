package fpt.teddypet.application.port.input.bookings;

import fpt.teddypet.application.dto.request.bookings.CreateBookingRequest;
import fpt.teddypet.application.dto.response.bookings.CreateBookingDepositIntentResponse;
import fpt.teddypet.application.dto.response.bookings.CreateBookingDepositPayosResponse;
import fpt.teddypet.application.dto.response.bookings.CreateBookingResponse;
import fpt.teddypet.domain.entity.Booking;
import fpt.teddypet.domain.entity.BookingDeposit;

public interface BookingDepositClientService {

    CreateBookingDepositIntentResponse createDepositIntent(CreateBookingRequest request);

    /**
     * Sau khi thanh toán cọc thành công: tạo booking thật từ booking_draft
     * và đánh dấu deposit đã thanh toán.
     */
    CreateBookingResponse confirmDepositAndCreateBooking(Long depositId, String paymentMethod);

    /**
     * Tạo link PayOS cho booking deposit (giữ chỗ 5 phút).
     * FE sẽ mở checkoutUrl trong popup/iframe tương tự order.
     */
    CreateBookingDepositPayosResponse createPayosCheckoutUrl(Long depositId, String returnUrl);

    /**
     * Sau khi cọc được xác nhận (tiền mặt / PayOS webhook): đồng bộ địa chỉ, pet profile,
     * và gắn bank_information (GUEST theo booking) vào tài khoản USER nếu có.
     */
    void runAfterDepositPaidSuccessfully(Booking booking, BookingDeposit deposit);
}

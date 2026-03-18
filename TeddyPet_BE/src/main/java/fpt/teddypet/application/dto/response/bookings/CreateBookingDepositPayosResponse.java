package fpt.teddypet.application.dto.response.bookings;

import java.time.LocalDateTime;

public record CreateBookingDepositPayosResponse(
        Long depositId,
        Long payosOrderCode,
        String checkoutUrl,
        LocalDateTime expiresAt,
        Long bookingId,
        String bookingCode
) {
}


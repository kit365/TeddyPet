package fpt.teddypet.application.dto.response.bookings;

import java.time.LocalDateTime;

public record CreateBookingDepositIntentResponse(
        Long depositId,
        LocalDateTime expiresAt,
        Long bookingId,
        String bookingCode
) {
}


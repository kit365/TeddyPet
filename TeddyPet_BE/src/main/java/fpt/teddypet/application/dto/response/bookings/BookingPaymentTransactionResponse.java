package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record BookingPaymentTransactionResponse(
        Long id,
        Long bookingId,
        String transactionType,
        BigDecimal amount,
        String paymentMethod,
        String transactionReference,
        UUID paidBy,
        String paidByName,
        LocalDateTime paidAt,
        UUID receivedBy,
        String status,
        LocalDateTime createdAt,
        String note
) {
}

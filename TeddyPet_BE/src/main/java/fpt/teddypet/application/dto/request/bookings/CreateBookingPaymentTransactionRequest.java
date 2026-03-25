package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record CreateBookingPaymentTransactionRequest(
        @NotBlank(message = "transactionType là bắt buộc") String transactionType,
        @NotNull(message = "amount là bắt buộc") @DecimalMin(value = "0.01", message = "amount phải > 0") BigDecimal amount,
        @NotBlank(message = "paymentMethod là bắt buộc") String paymentMethod,
        String transactionReference,
        UUID paidBy,
        String paidByName,
        @NotNull(message = "paidAt là bắt buộc") LocalDateTime paidAt,
        UUID receivedBy,
        String status,
        String note
) {
}

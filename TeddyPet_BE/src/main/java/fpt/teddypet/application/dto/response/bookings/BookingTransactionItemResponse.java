package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Một dòng trong danh sách giao dịch chi tiết: có thể là thanh toán cọc (booking_deposits)
 * hoặc thanh toán hóa đơn (booking_payment_transactions).
 */
public record BookingTransactionItemResponse(
        String transactionType, // "DEPOSIT" | "INVOICE_PAYMENT"
        Long id,
        BigDecimal amount,
        String paymentMethod,
        LocalDateTime paidAt,
        String status,
        String label, // "Thanh toán cọc" / "Thanh toán hóa đơn"
        String transactionReference,
        String paidByName,
        String note
) {
}

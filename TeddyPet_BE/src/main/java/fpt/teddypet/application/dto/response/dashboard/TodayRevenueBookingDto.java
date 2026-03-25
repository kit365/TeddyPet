package fpt.teddypet.application.dto.response.dashboard;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TodayRevenueBookingDto(
        Long bookingId,
        String bookingCode,
        String customerName,
        BigDecimal totalAmount,
        String status,
        String paymentStatus,
        LocalDateTime createdAt
) {
}

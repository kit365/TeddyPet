package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ClientBookingDetailResponse(
        Long id,
        String bookingCode,
        String customerName,
        String customerEmail,
        String customerPhone,
        String customerAddress,
        String bookingType,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal remainingAmount,
        BigDecimal deposit,
        String paymentStatus,
        String paymentMethod,
        String status,
        String internalNotes,
        LocalDateTime bookingStartDate,
        LocalDateTime bookingEndDate
) {
}


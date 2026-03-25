package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminBookingListItemResponse(
        String id,
        String bookingCode,
        String customerName,
        String customerEmail,
        String customerPhone,
        String customerAddress,
        String bookingType,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal remainingAmount,
        BigDecimal creditToRefund,
        BigDecimal depositAmount,
        Boolean depositPaid,
        String paymentStatus,
        String paymentMethod,
        String status,
        Boolean cancelRequested,
        String cancelledBy,
        String cancelledReason,
        LocalDateTime cancelledAt,
        String internalNotes,
        LocalDate bookingDateFrom,
        LocalDateTime bookingCheckInDate,
        LocalDateTime bookingCheckOutDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}

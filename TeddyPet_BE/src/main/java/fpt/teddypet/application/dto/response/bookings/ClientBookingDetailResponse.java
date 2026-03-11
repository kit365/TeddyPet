package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
                Boolean depositPaid,
                String paymentStatus,
                String paymentMethod,
                String status,
                String internalNotes,
                LocalDateTime bookingStartDate,
                LocalDateTime bookingEndDate,
                Long depositId,
                LocalDateTime depositExpiresAt,
                LocalDateTime createdAt,
                List<ClientBookingPetDetailResponse> pets) {
}

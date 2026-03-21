package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingRefundResponse(
        Long id,
        String status,
        BigDecimal requestedAmount,
        String currency,
        String customerReason,
        String evidenceUrls,
        String adminDecisionNote,
        String processedBy,
        String refundTransactionId,
        java.util.List<String> adminEvidenceUrls,
        LocalDateTime createdAt,
        LocalDateTime processedAt,
        LocalDateTime refundCompletedAt
) {
}

package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingDepositRefundPolicyResponse(
        Long id,
        String policyName,
        String description,
        BigDecimal depositPercentage,
        Integer fullRefundHours,
        BigDecimal fullRefundPercentage,
        Integer partialRefundHours,
        BigDecimal partialRefundPercentage,
        Integer noRefundHours,
        BigDecimal noRefundPercentage,
        BigDecimal noShowRefundPercentage,
        BigDecimal noShowPenalty,
        Boolean allowForceMajeure,
        BigDecimal forceMajeureRefundPercentage,
        Boolean forceMajeureRequiresEvidence,
        Boolean isDefault,
        Integer displayOrder,
        String highlightText,
        Boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}


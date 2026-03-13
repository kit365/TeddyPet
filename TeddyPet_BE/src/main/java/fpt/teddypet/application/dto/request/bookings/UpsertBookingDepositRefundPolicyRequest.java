package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpsertBookingDepositRefundPolicyRequest(
        @NotBlank(message = "Tên chính sách là bắt buộc") String policyName,
        String description,
        @NotNull(message = "Tỷ lệ cọc là bắt buộc") BigDecimal depositPercentage,
        @NotNull(message = "Giờ hoàn toàn phần là bắt buộc") @Min(0) Integer fullRefundHours,
        @NotNull(message = "Tỷ lệ hoàn toàn phần là bắt buộc") BigDecimal fullRefundPercentage,
        @NotNull(message = "Giờ hoàn một phần là bắt buộc") @Min(0) Integer partialRefundHours,
        @NotNull(message = "Tỷ lệ hoàn một phần là bắt buộc") BigDecimal partialRefundPercentage,
        @NotNull(message = "Giờ không hoàn là bắt buộc") @Min(0) Integer noRefundHours,
        @NotNull(message = "Tỷ lệ không hoàn là bắt buộc") BigDecimal noRefundPercentage,
        @NotNull(message = "Tỷ lệ hoàn khi không đến là bắt buộc") BigDecimal noShowRefundPercentage,
        @NotNull(message = "Mức phạt khi không đến là bắt buộc") BigDecimal noShowPenalty,
        @NotNull(message = "allowForceMajeure là bắt buộc") Boolean allowForceMajeure,
        @NotNull(message = "forceMajeureRefundPercentage là bắt buộc") BigDecimal forceMajeureRefundPercentage,
        @NotNull(message = "forceMajeureRequiresEvidence là bắt buộc") Boolean forceMajeureRequiresEvidence,
        @NotNull(message = "isDefault là bắt buộc") Boolean isDefault,
        Integer displayOrder,
        String highlightText,
        @NotNull(message = "isActive là bắt buộc") Boolean isActive
) {
}


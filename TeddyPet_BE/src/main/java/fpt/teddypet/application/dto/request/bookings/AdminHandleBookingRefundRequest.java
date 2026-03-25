package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotNull;

public record AdminHandleBookingRefundRequest(
        @NotNull Boolean approved,
        String adminNote,
        String refundTransactionId,
        java.util.List<String> adminEvidenceUrls
) {
}

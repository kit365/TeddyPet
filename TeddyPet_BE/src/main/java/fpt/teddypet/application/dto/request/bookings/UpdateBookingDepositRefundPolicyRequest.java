package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotNull;

public record UpdateBookingDepositRefundPolicyRequest(
        @NotNull(message = "refundPolicyId là bắt buộc") Long refundPolicyId) {
}


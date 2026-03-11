package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotNull;

public record ApproveBookingDepositRefundRequest(
        @NotNull(message = "approved là bắt buộc") Boolean approved,
        String refundMethod,
        String refundProof) {
}


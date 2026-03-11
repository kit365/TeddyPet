package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RequestBookingDepositRefundRequest(
        @NotBlank(message = "refundReason là bắt buộc")
        @Size(max = 2000, message = "refundReason tối đa 2000 ký tự")
        String refundReason) {
}


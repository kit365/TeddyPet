package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotBlank;

public record ConfirmFullPaymentRequest(
        @NotBlank(message = "paymentMethod là bắt buộc") String paymentMethod,
        String notes
) {
}

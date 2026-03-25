package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record BookingRefundRequest(
        @NotNull
        @DecimalMin(value = "0.0", inclusive = true)
        BigDecimal requestedAmount,
        @NotBlank
        String reason,
        Long bankInformationId,
        List<String> evidenceUrls
) {
}

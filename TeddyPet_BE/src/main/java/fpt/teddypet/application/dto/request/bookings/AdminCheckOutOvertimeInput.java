package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotNull;

public record AdminCheckOutOvertimeInput(
        @NotNull(message = "bookingPetServiceId là bắt buộc") Long bookingPetServiceId,
        String note
) {
}

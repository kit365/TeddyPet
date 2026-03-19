package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotBlank;

public record CancelBookingPetServiceRequest(
        @NotBlank(message = "cancelReason là bắt buộc") String cancelReason
) {
}


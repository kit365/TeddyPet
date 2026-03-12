package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotNull;

public record ApproveBookingCancelRequest(
        @NotNull(message = "approved là bắt buộc") Boolean approved
) {
}


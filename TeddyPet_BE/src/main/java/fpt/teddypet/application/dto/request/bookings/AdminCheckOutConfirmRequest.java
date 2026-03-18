package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AdminCheckOutConfirmRequest(
        @NotEmpty(message = "pets là bắt buộc") List<@Valid AdminCheckOutConfirmPetInput> pets
) {
}


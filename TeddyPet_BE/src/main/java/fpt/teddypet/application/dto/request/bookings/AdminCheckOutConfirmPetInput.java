package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AdminCheckOutConfirmPetInput(
        @NotNull(message = "petId là bắt buộc") Long petId,
        String departureCondition,
        List<String> departurePhotos
) {
}


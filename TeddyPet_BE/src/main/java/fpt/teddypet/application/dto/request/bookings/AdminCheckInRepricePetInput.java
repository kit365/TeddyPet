package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record AdminCheckInRepricePetInput(
        @NotNull(message = "petId là bắt buộc") Long petId,
        @NotBlank(message = "confirmedPetType là bắt buộc") String confirmedPetType,
        @NotNull(message = "confirmedWeight là bắt buộc") BigDecimal confirmedWeight,
        String arrivalCondition,
        List<String> arrivalPhotos,
        List<String> belongingPhotos
) {
}


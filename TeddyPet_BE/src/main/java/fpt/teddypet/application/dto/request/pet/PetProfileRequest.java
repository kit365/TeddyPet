package fpt.teddypet.application.dto.request.pet;

import fpt.teddypet.domain.enums.GenderEnum;
import fpt.teddypet.domain.enums.PetTypeEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PetProfileRequest(
        @NotBlank
        @Size(max = 100)
        String name,

        @NotNull
        PetTypeEnum petType,

        @Size(max = 100)
        String breed,

        GenderEnum gender,

        LocalDate birthDate,

        BigDecimal weight,

        @Size(max = 500)
        String avatarUrl,

        Boolean isNeutered,

        String healthNote
) {
}

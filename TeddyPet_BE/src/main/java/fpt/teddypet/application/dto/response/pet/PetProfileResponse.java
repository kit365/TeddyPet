package fpt.teddypet.application.dto.response.pet;

import fpt.teddypet.domain.enums.GenderEnum;
import fpt.teddypet.domain.enums.PetTypeEnum;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PetProfileResponse(
        Long id,
        UUID userId,
        String name,
        PetTypeEnum petType,
        String breed,
        GenderEnum gender,
        LocalDate birthDate,
        BigDecimal weight,
        String avatarUrl,
        Boolean isNeutered,
        String healthNote
) {
}

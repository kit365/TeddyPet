package fpt.teddypet.application.dto.request.staff;

import fpt.teddypet.domain.enums.staff.StaffProficiencyLevel;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record StaffSkillRequest(
        @NotNull
        Long staffId,

        @NotNull
        Long skillId,

        @NotNull
        StaffProficiencyLevel proficiencyLevel,

        @NotNull
        @DecimalMin(value = "0.00")
        @DecimalMax(value = "100.00")
        BigDecimal commissionRate
) {
}


package fpt.teddypet.application.dto.response.staff;

import fpt.teddypet.domain.enums.staff.StaffProficiencyLevel;

import java.math.BigDecimal;

public record StaffSkillResponse(
        Long id,
        Long staffId,
        Long skillId,
        String skillCode,
        String skillName,
        StaffProficiencyLevel proficiencyLevel,
        BigDecimal commissionRate,
        boolean active
) {
}


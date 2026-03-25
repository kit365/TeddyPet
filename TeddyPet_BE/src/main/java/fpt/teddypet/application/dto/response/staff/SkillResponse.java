package fpt.teddypet.application.dto.response.staff;

public record SkillResponse(
        Long id,
        String code,
        String name,
        String description,
        boolean active
) {
}


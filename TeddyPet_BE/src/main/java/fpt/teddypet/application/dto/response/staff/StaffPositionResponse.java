package fpt.teddypet.application.dto.response.staff;

public record StaffPositionResponse(
        Long id,
        String code,
        String name,
        String description,
        boolean active
) {
}

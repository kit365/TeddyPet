package fpt.teddypet.application.dto.response.dashboard;

public record PetDistributionResponse(
    String label,
    long count,
    String color
) {}

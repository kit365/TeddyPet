package fpt.teddypet.application.dto.response.bookings;

public record AdminPetFoodBroughtResponse(
        Long id,
        String foodBroughtType,
        String foodBrand,
        Integer quantity,
        String feedingInstructions
) {
}


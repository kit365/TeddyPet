package fpt.teddypet.application.dto.request.bookings;

/**
 * One item of pet food brought by the owner (maps to pet_food_brought row).
 */
public record PetFoodBroughtItemRequest(
        String foodBroughtType,
        String foodBrand,
        Integer quantity,
        String feedingInstructions
) {
}

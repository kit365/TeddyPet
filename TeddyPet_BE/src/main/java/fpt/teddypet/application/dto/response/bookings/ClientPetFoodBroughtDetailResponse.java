package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;

public record ClientPetFoodBroughtDetailResponse(
                Long id,
                String foodBroughtType,
                String foodBrand,
                Integer quantity,
                String feedingInstructions) {
}

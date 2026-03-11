package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.util.List;

public record ClientBookingPetDetailResponse(
        Long id,
        String petName,
        String petType,
        String emergencyContactName,
        String emergencyContactPhone,
        BigDecimal weightAtBooking,
        String petConditionNotes,
        String arrivalCondition,
        String departureCondition,
        String arrivalPhotos,
        String departurePhotos,
        String belongingPhotos,
        String foodBrought,

        List<ClientBookingPetServiceDetailResponse> services,
        List<ClientPetFoodBroughtDetailResponse> foodItems) {
}

package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.util.List;

public record AdminBookingPetResponse(
        Long id,
        Long bookingId,
        String petName,
        String petType,
        String emergencyContactName,
        String emergencyContactPhone,
        BigDecimal weightAtBooking,
        String petConditionNotes,
        String healthIssues,
        String arrivalCondition,
        String departureCondition,
        String arrivalPhotos,
        String departurePhotos,
        String belongingPhotos,
        Object foodBrought,
        Object foodBroughtType,
        String feedingInstructions,
        List<AdminPetFoodBroughtResponse> foodItems,
        List<AdminBookingPetServiceResponse> services
) {
}


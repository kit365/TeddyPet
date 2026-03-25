package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ClientBookingPetServiceDetailResponse(
        Long id,
        List<Long> assignedStaffIds,
        String assignedStaffNames,
        String serviceName,
        String timeSlotName,
        LocalDate estimatedCheckInDate,
        LocalDate estimatedCheckOutDate,
        LocalDate actualCheckInDate,
        LocalDate actualCheckOutDate,
        Integer numberOfNights,
        LocalDateTime scheduledStartTime,
        LocalDateTime scheduledEndTime,
        LocalDateTime actualStartTime,
        LocalDateTime actualEndTime,
        BigDecimal basePrice,
        BigDecimal subtotal,
        String status,
        String staffNotes,
        String beforePhotos,
        String duringPhotos,
        String afterPhotos,
        Integer customerRating,
        String customerReview,

        // Add-ons for room tracking
        Long roomId,
        String roomName,
        String displayTypeName,
        String roomNumber,

        List<ClientBookingPetServiceItemDetailResponse> items) {
}

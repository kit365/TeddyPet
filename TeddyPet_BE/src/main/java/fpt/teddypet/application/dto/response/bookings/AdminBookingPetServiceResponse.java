package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record AdminBookingPetServiceResponse(
        Long id,
        Long bookingPetId,
        Long assignedStaffId,
        Long serviceId,
        Long serviceComboId,
        String serviceName,
        Long timeSlotId,
        Long roomId,
        LocalDate estimatedCheckInDate,
        LocalDate estimatedCheckOutDate,
        LocalDate actualCheckInDate,
        LocalDate actualCheckOutDate,
        Integer numberOfNights,
        LocalDateTime scheduledStartTime,
        LocalDateTime scheduledEndTime,
        LocalDateTime actualStartTime,
        LocalDateTime actualEndTime,
        BigDecimal unitPrice,
        BigDecimal subtotal,
        String status,
        String staffNotes,
        Integer customerRating,
        String customerReview,
        String duringPhotos,
        String afterPhotos,
        String beforePhotos,
        String videos,
        List<AdminBookingPetServiceItemResponse> items
) {
}


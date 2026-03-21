package fpt.teddypet.application.dto.response.staff;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record WorkShiftBookingPetServiceItemResponse(
        Long bookingPetServiceId,
        String bookingCode,
        Long bookingId,
        String customerName,
        String petName,
        String serviceName,
        LocalDate bookingDateFrom,
        LocalDateTime scheduledStartTime,
        LocalDateTime scheduledEndTime
) {
}

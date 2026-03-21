package fpt.teddypet.application.dto.response.feedback;

import java.time.LocalDateTime;

public record BookingReviewResponse(
        Long id,
        String bookingCode,
        String customerName,
        String serviceName,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {
}

package fpt.teddypet.application.dto.response.bookings;

import java.time.LocalDateTime;

public record AdminBookingPetServiceItemResponse(
        Long id,
        Long itemServiceId,
        String itemServiceName,
        String itemType,
        String chargeReason,
        String chargeEvidence,
        String chargedBy,
        String chargeApprovedBy,
        LocalDateTime chargeApprovedAt,
        String notes,
        String staffNotes
) {
}

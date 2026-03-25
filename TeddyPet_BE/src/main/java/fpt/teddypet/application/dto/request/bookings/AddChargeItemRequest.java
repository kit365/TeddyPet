package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotNull;

/**
 * Nhân viên thêm dịch vụ additional charge (isAdditionalCharge=true) vào booking_pet_service.
 */
public record AddChargeItemRequest(
        @NotNull(message = "Dịch vụ charge là bắt buộc")
        Long itemServiceId,

        String chargeReason,
        String chargeEvidence,

        @NotNull(message = "chargedBy (tên nhân viên) là bắt buộc")
        String chargedBy
) {
}

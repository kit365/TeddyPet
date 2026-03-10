package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotBlank;

/**
 * Xác nhận khách hàng đã đồng ý additional charge (chargeApprovedBy = tên khách, chargeApprovedAt = thời điểm xác nhận).
 */
public record ApproveChargeItemRequest(
        @NotBlank(message = "Tên khách hàng xác nhận là bắt buộc")
        String chargeApprovedBy
) {
}

package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotNull;

public record ApproveBookingCancelRequest(
        @NotNull(message = "approved là bắt buộc") Boolean approved,
        String staffNotes,
        String refundProof,
        /** Khi true và approved=true: admin hủy đơn dù khách chưa gửi yêu cầu (bỏ qua cancelRequested). */
        Boolean forceAdminCancel
) {
}


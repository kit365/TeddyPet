package fpt.teddypet.application.dto.request.orders.order;

import jakarta.validation.constraints.NotNull;

public record AdminHandleOrderRefundRequest(
        @NotNull Boolean approved,
        String adminNote
) {
}


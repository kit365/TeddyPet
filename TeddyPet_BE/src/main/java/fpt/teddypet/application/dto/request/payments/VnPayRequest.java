package fpt.teddypet.application.dto.request.payments;

import java.util.UUID;

public record VnPayRequest(
        UUID orderId,
        String returnUrl
) {
}

package fpt.teddypet.application.dto.response.payment;

import java.math.BigDecimal;

public record PaymentResult(
        boolean isSuccess,
        String message,
        String transactionId,
        String orderCode,
        BigDecimal amount,
        String gatewayName
) {
}

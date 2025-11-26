package fpt.teddypet.application.dto.response.payment;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record GatewayCallbackResult(
    boolean success,
    String transactionId,
    String message,
    BigDecimal amount,
    String orderCode,
    String gatewayResponseCode
) {
    public PaymentResult toPaymentResult(String gatewayName) {
        return new PaymentResult(
            success,
            message,
            transactionId,
            orderCode,
            amount,
            gatewayName
        );
    }
}

package fpt.teddypet.application.dto.response.payment;

import lombok.Builder;

import java.math.BigDecimal;

/**
 * Kết quả xử lý callback từ cổng thanh toán (vd: PayOS webhook).
 * transactionId/orderCode dùng để tìm Payment; gatewayResponseCode + rawPayload lưu lại để đối soát.
 */
@Builder
public record GatewayCallbackResult(
    boolean success,
    String transactionId,
    String message,
    BigDecimal amount,
    String orderCode,
    String gatewayResponseCode,
    /** JSON đầy đủ payload webhook đã verify (PayOS WebhookData), lưu vào payments.gateway_raw_payload */
    String rawPayload
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

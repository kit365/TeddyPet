package fpt.teddypet.infrastructure.adapter.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.dto.response.payment.GatewayCallbackResult;
import fpt.teddypet.application.exception.PaymentException;
import fpt.teddypet.application.port.output.payment.PaymentGatewayPort;
import fpt.teddypet.application.util.OrderValidator;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

@Slf4j
@Component
@RequiredArgsConstructor
public class PayosGatewayAdapter implements PaymentGatewayPort<Webhook> {

    private final PayOS payOS;
    private final ObjectMapper objectMapper;

    @Override
    public PaymentGatewayEnum getGateway() {
        return PaymentGatewayEnum.PAYOS;
    }

    @Override
    public String buildPaymentUrl(Order order, String ipAddress, String returnUrl) {
        try {
            OrderValidator.validateForPayment(order);

            Long orderNumericCode = order.getNumericCode();
            if (orderNumericCode == null) {
                log.error("Order {} has no numeric_code.", order.getId());
                throw new PaymentException("Lỗi hệ thống: Đơn hàng chưa có mã số định danh numeric_code.");
            }

            String description = "Thanh toán " + order.getOrderCode();
            if (description.length() > 25) {
                description = order.getOrderCode();
            }

            long amount = order.getFinalAmount().longValue();

            CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                    .orderCode(orderNumericCode)
                    .amount(amount)
                    .description(description)
                    .returnUrl(returnUrl)
                    .cancelUrl(returnUrl)
                    .build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(request);
            return response.getCheckoutUrl();

        } catch (Exception e) {
            log.error("PayosGatewayAdapter failed to create payment link for order {}: {}", order.getId(),
                    e.getMessage());
            throw new PaymentException("PayOS Error: " + e.getMessage(), e);
        }
    }

    @Override
    public GatewayCallbackResult handleCallback(Webhook webhook, HttpServletRequest request) {
        try {
            // Bước 1: PayOS gửi POST JSON tới /api/payment/payos/webhook. SDK verify chữ ký và trả về WebhookData.
            WebhookData verifiedData = payOS.webhooks().verify(webhook);

            boolean success = "00".equals(verifiedData.getCode());

            // Bước 2: Serialize toàn bộ payload đã verify thành JSON để lưu vào payments.gateway_raw_payload (đối soát sau này).
            String rawPayloadJson = null;
            try {
                rawPayloadJson = objectMapper.writeValueAsString(verifiedData);
            } catch (Exception e) {
                log.warn("Could not serialize PayOS WebhookData to JSON: {}", e.getMessage());
            }

            return GatewayCallbackResult.builder()
                    .success(success)
                    .transactionId(String.valueOf(verifiedData.getOrderCode()))
                    .message(success ? "Thanh toán thành công qua PayOS"
                            : "Thanh toán thất bại qua PayOS. Code: " + verifiedData.getCode())
                    .amount(java.math.BigDecimal.valueOf(verifiedData.getAmount()))
                    .orderCode(String.valueOf(verifiedData.getOrderCode()))
                    .gatewayResponseCode(verifiedData.getCode())
                    .rawPayload(rawPayloadJson)
                    .build();

        } catch (Exception e) {
            log.error("PayOS callback verification failed", e);
            throw new PaymentException("PayOS verification failed: " + e.getMessage(), e);
        }
    }
}

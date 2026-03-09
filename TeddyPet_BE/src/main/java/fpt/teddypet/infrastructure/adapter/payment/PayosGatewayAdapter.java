package fpt.teddypet.infrastructure.adapter.payment;

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
            if (webhook == null) {
                throw new PaymentException("Webhook object is null");
            }
            
            WebhookData data = webhook.getData();
            
            // PayOS test webhook confirmation (orderCode = 123 hoặc test data)
            // Khi add webhook URL trên dashboard, PayOS gửi test request
            if (data != null && webhook.getSignature() == null) {
                log.warn("⚠️ Received webhook without signature - likely test ping or invalid request");
                // Return success for test ping but don't process as real payment
                return GatewayCallbackResult.builder()
                        .success(false)
                        .transactionId("test")
                        .message("Test webhook received - no signature")
                        .orderCode(data.getOrderCode() != null ? String.valueOf(data.getOrderCode()) : "0")
                        .build();
            }
            
            WebhookData verifiedData = payOS.webhooks().verify(webhook);

            boolean success = "00".equals(verifiedData.getCode());
            
            log.info("✅ PayOS callback verified - OrderCode: {}, Success: {}, Code: {}", 
                    verifiedData.getOrderCode(), success, verifiedData.getCode());

            return GatewayCallbackResult.builder()
                    .success(success)
                    .transactionId(String.valueOf(verifiedData.getOrderCode()))
                    .message(success ? "Thanh toán thành công qua PayOS"
                            : "Thanh toán thất bại qua PayOS. Code: " + verifiedData.getCode())
                    .amount(verifiedData.getAmount() != null ? java.math.BigDecimal.valueOf(verifiedData.getAmount()) : null)
                    .orderCode(String.valueOf(verifiedData.getOrderCode()))
                    .gatewayResponseCode(verifiedData.getCode())
                    .build();

        } catch (Exception e) {
            log.error("PayOS callback verification failed", e);
            throw new PaymentException("PayOS verification failed: " + e.getMessage(), e);
        }
    }
}

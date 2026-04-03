package fpt.teddypet.infrastructure.adapter.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.dto.response.payment.GatewayCallbackResult;
import fpt.teddypet.application.dto.response.payment.BuildPaymentUrlResult;
import fpt.teddypet.application.exception.PaymentException;
import fpt.teddypet.application.port.output.payment.PaymentGatewayPort;
import fpt.teddypet.application.util.OrderValidator;
import fpt.teddypet.config.PayosConfig;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

@Slf4j
@Component
@RequiredArgsConstructor
public class PayosGatewayAdapter implements PaymentGatewayPort<Webhook> {

    private static final String PAYOS_API_GET_LINK = "https://api-merchant.payos.vn/v2/payment-requests/%d";
    private static final String PAYOS_CHECKOUT_BASE = "https://pay.payos.vn/web/";

    private final PayOS payOS;
    private final ObjectMapper objectMapper;
    private final PayosConfig payosConfig;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public PaymentGatewayEnum getGateway() {
        return PaymentGatewayEnum.PAYOS;
    }

    @Override
    public BuildPaymentUrlResult buildPaymentUrl(Order order, String ipAddress, String returnUrl) {
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
            return BuildPaymentUrlResult.of(response.getCheckoutUrl());

        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("đã tồn tại") || msg.contains("already exist")) {
                String existingUrl = fetchExistingPaymentLinkUrl(order.getNumericCode());
                if (existingUrl != null) {
                    log.info("PayOS: returning existing payment link for order {} (orderCode={}).", order.getId(), order.getNumericCode());
                    return BuildPaymentUrlResult.of(existingUrl);
                }
            }
            log.error("PayosGatewayAdapter failed to create payment link for order {}: {}", order.getId(), msg);
            throw new PaymentException("PayOS Error: " + msg, e);
        }
    }

    /**
     * Dùng cho domain khác ngoài Order (vd: BookingDeposit): tạo link PayOS theo orderCode + amount.
     * Nếu PayOS báo orderCode đã tồn tại, cố gắng fetch lại link đang PENDING.
     */
    public String buildPaymentUrlByOrderCode(Long orderCode, long amount, String description, String returnUrl) {
        if (orderCode == null) {
            throw new PaymentException("Lỗi hệ thống: thiếu orderCode để tạo PayOS link.");
        }
        try {
            String desc = description != null ? description : "Thanh toán";
            if (desc.length() > 25) {
                desc = desc.substring(0, 25);
            }

            CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(amount)
                    .description(desc)
                    .returnUrl(returnUrl)
                    .cancelUrl(returnUrl)
                    .build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(request);
            return response.getCheckoutUrl();
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("đã tồn tại") || msg.contains("already exist")) {
                String existingUrl = fetchExistingPaymentLinkUrl(orderCode);
                if (existingUrl != null) {
                    log.info("PayOS: returning existing payment link (orderCode={}).", orderCode);
                    return existingUrl;
                }
            }
            log.error("PayosGatewayAdapter failed to create payment link (orderCode={}): {}", orderCode, msg);
            throw new PaymentException("PayOS Error: " + msg, e);
        }
    }

    /**
     * Gọi PayOS API GET /v2/payment-requests/{orderCode} để lấy thông tin link đã tạo,
     * rồi build checkoutUrl = https://pay.payos.vn/web/{paymentLinkId}.
     */
    private String fetchExistingPaymentLinkUrl(Long orderNumericCode) {
        if (orderNumericCode == null) return null;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-client-id", payosConfig.getClientId());
            headers.set("x-api-key", payosConfig.getApiKey());
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            String url = String.format(PAYOS_API_GET_LINK, orderNumericCode);
            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                JsonNode root = objectMapper.readTree(resp.getBody());
                if ("00".equals(root.path("code").asText(""))) {
                    JsonNode data = root.path("data");

                    // Chỉ tái sử dụng link nếu trạng thái trên PayOS vẫn còn chờ thanh toán (PENDING).
                    String status = data.path("status").asText("");
                    if (!"PENDING".equalsIgnoreCase(status)) {
                        log.info("PayOS payment-request {} (orderCode={}) has status '{}', not reusing checkoutUrl.",
                                data.path("id").asText(""), orderNumericCode, status);
                        return null;
                    }

                    String id = data.path("id").asText("");
                    if (!id.isBlank()) {
                        return PAYOS_CHECKOUT_BASE + id;
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Could not fetch existing PayOS link for orderCode {}: {}", orderNumericCode, ex.getMessage());
        }
        return null;
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

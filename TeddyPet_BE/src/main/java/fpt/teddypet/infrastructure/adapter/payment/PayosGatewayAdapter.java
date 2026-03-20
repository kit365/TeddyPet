package fpt.teddypet.infrastructure.adapter.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.dto.response.payment.BuildPaymentUrlResult;
import fpt.teddypet.application.dto.response.payment.GatewayCallbackResult;
import fpt.teddypet.application.exception.PaymentException;
import fpt.teddypet.application.port.output.payment.PaymentGatewayPort;
import fpt.teddypet.application.port.output.payment.PaymentOrderCodePort;
import fpt.teddypet.application.util.OrderValidator;
import fpt.teddypet.config.PayosConfig;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

@Slf4j
@Component
public class PayosGatewayAdapter implements PaymentGatewayPort<Webhook> {

    private static final String PAYOS_API_GET_LINK = "https://api-merchant.payos.vn/v2/payment-requests/%d";
    private static final String PAYOS_API_CANCEL_LINK = "https://api-merchant.payos.vn/v2/payment-requests/%d/cancel";
    private static final String PAYOS_CHECKOUT_BASE = "https://pay.payos.vn/web/";

    private final PayOS payOS;
    private final ObjectMapper objectMapper;
    private final PayosConfig payosConfig;
    private final PaymentOrderCodePort paymentOrderCodePort;
    private final RestTemplate restTemplate;

    public PayosGatewayAdapter(PayOS payOS, ObjectMapper objectMapper, PayosConfig payosConfig, PaymentOrderCodePort paymentOrderCodePort) {
        this.payOS = payOS;
        this.objectMapper = objectMapper;
        this.payosConfig = payosConfig;
        this.paymentOrderCodePort = paymentOrderCodePort;
        
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(10000);
        this.restTemplate = new RestTemplate(factory);
    }

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

            String description = "TT " + order.getOrderCode();
            if (description.length() > 25) {
                description = order.getOrderCode();
                if (description.length() > 25) {
                    description = description.substring(0, 25);
                }
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
                return handleExistingPaymentLink(order, ipAddress, returnUrl);
            }
            log.error("PayosGatewayAdapter failed to create payment link for order {}: {}", order.getId(), msg);
            throw new PaymentException("PayOS Error: " + msg, e);
        }
    }

    /**
     * Khi PayOS báo "orderCode đã tồn tại":
     * 1. Fetch link cũ, kiểm tra amount
     * 2. Nếu amount khớp → tái sử dụng link
     * 3. Nếu amount KHÔNG khớp → cancel link cũ, tạo link MỚI với amount đúng
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
                ExistingLinkInfo existing = fetchExistingPaymentInfo(orderCode);
                if (existing != null && existing.checkoutUrl() != null) {
                    log.info("PayOS: returning existing payment link (orderCode={}).", orderCode);
                    return existing.checkoutUrl();
                }
            }
            log.error("PayosGatewayAdapter failed to create payment link (orderCode={}): {}", orderCode, msg);
            throw new PaymentException("PayOS Error: " + msg, e);
        }
    }

    private BuildPaymentUrlResult handleExistingPaymentLink(Order order, String ipAddress, String returnUrl) {
        Long orderNumericCode = order.getNumericCode();
        long expectedAmount = order.getFinalAmount().longValue();

        ExistingLinkInfo existing = fetchExistingPaymentInfo(orderNumericCode);

        if (existing != null && existing.status().equalsIgnoreCase("PENDING")) {
            if (existing.amount() == expectedAmount) {
                log.info("PayOS: reusing existing payment link for order {} (orderCode={}, status={}, amount={}).",
                        order.getId(), orderNumericCode, existing.status(), expectedAmount);
                return BuildPaymentUrlResult.of(existing.checkoutUrl());
            }

            // Amount mismatch: PayOS does not allow reusing same orderCode after cancel. Create with NEW orderCode.
            log.warn("PayOS: amount mismatch for order {} (orderCode={}). " +
                            "Expected={}, existing={}. Cancelling old link and creating new one with new orderCode.",
                    order.getId(), orderNumericCode, expectedAmount, existing.amount());

            boolean cancelled = cancelPaymentLink(orderNumericCode);
            if (cancelled) {
                return createPaymentLinkWithNewNumericCode(order, returnUrl, expectedAmount);
            } else {
                log.error("PayOS: failed to cancel old link for order {} (orderCode={}). Cannot create new link.",
                        order.getId(), orderNumericCode);
                throw new PaymentException("Không thể hủy link thanh toán cũ để tạo mới. Vui lòng liên hệ hỗ trợ.");
            }
        }

        // Link đã hủy / hết hạn trên PayOS: numeric_code cũ vẫn chiếm slot "đã tồn tại" → tạo link mới với mã PayOS mới
        if (existing != null && isPayOsLinkDeadForReuse(existing.status())) {
            log.info("PayOS: prior link status '{}' for order {} (orderCode={}) — creating fresh payment link with new orderCode.",
                    existing.status(), order.getId(), orderNumericCode);
            return createPaymentLinkWithNewNumericCode(order, returnUrl, expectedAmount);
        }

        // PayOS báo đã tồn tại nhưng không đọc được trạng thái: thử tạo với mã mới (tránh kẹt vĩnh viễn)
        if (existing == null) {
            log.warn("PayOS: 'already exist' but could not fetch link for order {} (orderCode={}). Trying new PayOS orderCode.",
                    order.getId(), orderNumericCode);
            return createPaymentLinkWithNewNumericCode(order, returnUrl, expectedAmount);
        }

        log.warn("PayOS: existing link for order {} (orderCode={}) has status '{}', cannot reuse safely.",
                order.getId(), orderNumericCode, existing.status());
        throw new PaymentException("Đơn thanh toán đã được tạo trước đó. Vui lòng kiểm tra email hoặc thử lại sau vài phút.");
    }

    private static boolean isPayOsLinkDeadForReuse(String status) {
        if (status == null || status.isBlank()) {
            return false;
        }
        String s = status.trim();
        return s.equalsIgnoreCase("CANCELLED")
                || s.equalsIgnoreCase("EXPIRED")
                || s.equalsIgnoreCase("FAILED")
                || s.equalsIgnoreCase("PAID")
                || s.equalsIgnoreCase("PROCESSING")
                || s.equalsIgnoreCase("COMPLETED");
    }

    /**
     * Tạo link PayOS mới với {@link PaymentOrderCodePort#getNext()} — không gắn vài {@code order.numericCode} (cột DB không updatable).
     * Webhook / tra cứu payment dùng {@code transactionId} trên bản ghi Payment.
     */
    private BuildPaymentUrlResult createPaymentLinkWithNewNumericCode(Order order, String returnUrl, long expectedAmount) {
        try {
            long newOrderCode = paymentOrderCodePort.getNext();
            String description = "TT " + order.getOrderCode();
            if (description.length() > 25) {
                description = order.getOrderCode();
                if (description.length() > 25) {
                    description = description.substring(0, 25);
                }
            }

            CreatePaymentLinkRequest retryRequest = CreatePaymentLinkRequest.builder()
                    .orderCode(newOrderCode)
                    .amount(expectedAmount)
                    .description(description)
                    .returnUrl(returnUrl)
                    .cancelUrl(returnUrl)
                    .build();

            CreatePaymentLinkResponse retryResponse = payOS.paymentRequests().create(retryRequest);
            log.info("PayOS: created new payment link with orderCode={} amount={} for order {}.",
                    newOrderCode, expectedAmount, order.getId());
            return BuildPaymentUrlResult.of(retryResponse.getCheckoutUrl(), String.valueOf(newOrderCode));
        } catch (Exception ex) {
            log.error("PayOS: failed to create new link with fresh orderCode for order {}: {}",
                    order.getId(), ex.getMessage());
            throw new PaymentException("Không thể tạo lại link thanh toán. Vui lòng thử lại sau.", ex);
        }
    }

    /**
     * DTO nội bộ chứa thông tin link PayOS đã tồn tại.
     */
    private record ExistingLinkInfo(String checkoutUrl, long amount, String status) {}

    /**
     * Gọi PayOS API GET /v2/payment-requests/{orderCode} để lấy thông tin link đã tạo,
     * bao gồm amount và status.
     */
    private ExistingLinkInfo fetchExistingPaymentInfo(Long orderNumericCode) {
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

                    String status = data.path("status").asText("");
                    long amount = data.path("amount").asLong(0);
                    String id = data.path("id").asText("");

                    String checkoutUrl = !id.isBlank() ? PAYOS_CHECKOUT_BASE + id : null;

                    return new ExistingLinkInfo(checkoutUrl, amount, status);
                }
            }
        } catch (Exception ex) {
            log.warn("Could not fetch existing PayOS link for orderCode {}: {}", orderNumericCode, ex.getMessage());
        }
        return null;
    }

    /**
     * Hủy link thanh toán PayOS đã tồn tại.
     * POST /v2/payment-requests/{orderCode}/cancel
     */
    private boolean cancelPaymentLink(Long orderNumericCode) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-client-id", payosConfig.getClientId());
            headers.set("x-api-key", payosConfig.getApiKey());
            headers.setContentType(MediaType.APPLICATION_JSON);

            String body = "{\"cancellationReason\":\"Amount mismatch - recreating with correct amount\"}";
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            String url = String.format(PAYOS_API_CANCEL_LINK, orderNumericCode);
            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (resp.getStatusCode().is2xxSuccessful()) {
                log.info("PayOS: successfully cancelled payment link for orderCode {}.", orderNumericCode);
                return true;
            } else {
                log.warn("PayOS: cancel link returned status {} for orderCode {}.", resp.getStatusCode(), orderNumericCode);
            }
        } catch (Exception ex) {
            log.error("PayOS: failed to cancel link for orderCode {}: {}", orderNumericCode, ex.getMessage());
        }
        return false;
    }

    /**
     * Public wrapper để gọi cancel link PayOS (best-effort).
     * Dùng khi user back/tắt trình duyệt làm link vẫn PENDING.
     */
    public boolean cancelPaymentLinkByOrderCode(Long orderCode) {
        return cancelPaymentLink(orderCode);
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

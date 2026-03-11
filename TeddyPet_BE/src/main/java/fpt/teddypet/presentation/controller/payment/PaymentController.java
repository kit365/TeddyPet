package fpt.teddypet.presentation.controller.payment;

import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.port.input.payment.PaymentService;
import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.model.webhooks.Webhook;

import java.util.UUID;

import static fpt.teddypet.presentation.constants.ApiConstants.API_PAYMENT;

@Slf4j
@RestController
@RequestMapping(API_PAYMENT)
@Tag(name = "Payment", description = "API quản lý thanh toán tập trung")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create")
    @Operation(summary = "Tạo link thanh toán", description = "Khởi tạo thanh toán cho đơn hàng (Cần được Admin xác nhận phí ship trước)")
    public ResponseEntity<ApiResponse<String>> createPayment(
            @RequestParam UUID orderId,
            @RequestParam PaymentGatewayEnum gateway,
            @RequestParam(required = false) String returnUrl,
            HttpServletRequest request) {

        String ipAddress = getClientIp(request);
        String paymentUrl = paymentService.initiatePayment(orderId, gateway, returnUrl, ipAddress);

        return ResponseEntity.ok(ApiResponse.success("Link thanh toán được tạo thành công", paymentUrl));
    }

    /**
     * PayOS webhook health check - để verify URL
     */
    @GetMapping("/payos/webhook")
    @Operation(summary = "PayOS Webhook Health", description = "Health check cho PayOS verify URL")
    public ResponseEntity<String> webhookHealth() {
        return ResponseEntity.ok("OK");
    }

    /**
     * Webhook PayOS - Nhận thông báo từ PayOS khi thanh toán hoàn tất
     */
    @PostMapping("/payos/webhook")
    @Operation(summary = "PayOS Webhook", description = "Nhận thông báo tự động từ PayOS")
    public ResponseEntity<Void> handlePayosWebhook(@RequestBody Webhook webhook, HttpServletRequest request) {
        log.info("📥 Nhận Webhook từ PayOS - Data: {}", webhook.getData());

        if (webhook == null || webhook.getData() == null) {
            log.warn("Invalid webhook received - null data");
            return ResponseEntity.badRequest().build();
        }

        try {
            paymentService.processPaymentCallback(
                    PaymentGatewayEnum.PAYOS,
                    webhook,
                    request);
            log.info("✅ PayOS webhook processed successfully");
        } catch (Exception e) {
            log.error("❌ PayOS webhook processing failed: {}", e.getMessage(), e);
        }

        return ResponseEntity.ok().build();
    }

    private String getClientIp(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isBlank() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        } else {
            // X-Forwarded-For can contain multiple IPs, pick the first one
            ipAddress = ipAddress.split(",")[0].trim();
        }
        return ipAddress;
    }
}

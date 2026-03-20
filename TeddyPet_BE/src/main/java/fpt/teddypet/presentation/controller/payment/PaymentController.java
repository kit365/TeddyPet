package fpt.teddypet.presentation.controller.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import fpt.teddypet.application.dto.common.ApiResponse;
import fpt.teddypet.application.port.input.payment.PaymentService;
import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
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
    private final ObjectMapper objectMapper;

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

    @PostMapping("/payos/cancel")
    @Operation(summary = "Hủy link PayOS đang treo", description = "Best-effort cancel link PayOS cho đơn (khi user back/tắt trình duyệt).")
    public ResponseEntity<ApiResponse<Boolean>> cancelPayosPaymentLink(@RequestParam UUID orderId) {
        boolean cancelled = paymentService.cancelPayosPaymentLink(orderId);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi yêu cầu hủy link PayOS", cancelled));
    }

    /**
     * PayOS kiểm tra URL webhook bằng GET (không có body/JSON) khi cấu hình trong dashboard. Trả 200 để PayOS coi URL hoạt động.
     * THỰC TẾ webhook thanh toán sẽ gọi POST JSON và được xử lý ở handlePayosWebhook.
     */
    @GetMapping(value = "/payos/webhook", consumes = MediaType.ALL_VALUE)
    @Operation(summary = "PayOS Webhook check (GET)", description = "Cho PayOS dashboard kiểm tra URL")
    public ResponseEntity<Void> payosWebhookCheck() {
        return ResponseEntity.ok().build();
    }

    /**
     * Webhook PayOS - Nhận thông báo từ PayOS khi thanh toán hoàn tất hoặc hủy.
     * PayOS gửi POST JSON (body = Webhook: data + signature). Service verify chữ ký, cập nhật Payment/Order,
     * và lưu gateway_response_code + gateway_raw_payload vào bảng payments. Xem docs/PAYOS_WEBHOOK_FLOW.md.
     */
    @PostMapping(value = "/payos/webhook", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "PayOS Webhook", description = "Nhận thông báo tự động từ PayOS")
    public ResponseEntity<Void> handlePayosWebhook(@RequestBody Webhook webhook, HttpServletRequest request) {
        try {
            log.info("📥 [INCOMING] Nhận Webhook từ PayOS: {}", objectMapper.writeValueAsString(webhook));
        } catch (Exception e) {
            log.info("📥 Nhận Webhook từ PayOS (serialize error): {}", webhook);
        }

        paymentService.processPaymentCallback(
                PaymentGatewayEnum.PAYOS,
                webhook,
                request);

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

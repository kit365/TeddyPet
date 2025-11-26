//package fpt.teddypet.presentation.controller.payment;
//import fpt.teddypet.application.dto.common.ApiResponse;
//
//import fpt.teddypet.application.dto.request.payments.VnPayCallbackDTO;
//import fpt.teddypet.application.dto.request.payments.VnPayRequest;
//import fpt.teddypet.application.dto.response.payment.PaymentResult;
//import fpt.teddypet.application.mapper.payments.VnPayCallbackMapper;
//import fpt.teddypet.application.port.input.payment.PaymentService;
//
//import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
//import io.swagger.v3.oas.annotations.Operation;
//import io.swagger.v3.oas.annotations.tags.Tag;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.validation.Valid;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.HashMap;
//import java.util.Map;
//
//import static fpt.teddypet.presentation.constants.ApiConstants.API_PAYMENT;
//
//@Slf4j
//@RestController
//@RequestMapping(API_PAYMENT)
//@Tag(name = "VNPay Payment", description = "API thanh toán VNPay")
//@RequiredArgsConstructor
//public class VnPayController {
//
//    private final PaymentService paymentService;
//
//    @PostMapping("/create")
//    @PreAuthorize("isAuthenticated()")
//    @Operation(summary = "Tạo URL thanh toán VNPay", description = "Tạo URL thanh toán VNPay cho đơn hàng")
//    public ResponseEntity<ApiResponse<String>> createPayment(
//            @Valid @RequestBody VnPayRequest request,
//            HttpServletRequest httpRequest) {
//
//        String ipAddress = getClientIp(httpRequest);
//        String paymentUrl = paymentService.initiatePayment(
//                request.orderId(),
//                PaymentGatewayEnum.VNPAY,
//                request.returnUrl(),
//                ipAddress
//        );
//
//        return ResponseEntity.ok(ApiResponse.success("URL thanh toán được tạo thành công", paymentUrl));
//    }
//
//    @GetMapping("/callback")
//    @Operation(summary = "VNPay callback", description = "Xử lý callback từ VNPay sau khi thanh toán")
//    public ResponseEntity<ApiResponse<PaymentResult>> handleCallback(
//            @RequestParam Map<String, String> allParams,
//            HttpServletRequest httpRequest) {
//
//        log.info("🔔 VNPay callback received with params: {}", allParams.keySet());
//
//        VnPayCallbackDTO callbackDto = VnPayCallbackMapper.fromParams(allParams);
//        PaymentResult result = paymentService.processPaymentCallback(
//                PaymentGatewayEnum.VNPAY,
//                callbackDto,
//                httpRequest
//        );
//
//        if (result.isSuccess()) {
//            return ResponseEntity.ok(ApiResponse.success(result.message(), result));
//        } else {
//            return ResponseEntity.ok(ApiResponse.error(result.message()));
//        }
//    }
//
//    @GetMapping("/ipn")
//    @Operation(summary = "VNPay IPN", description = "Instant Payment Notification từ VNPay")
//    public ResponseEntity<Map<String, String>> handleIPN(
//            @RequestParam Map<String, String> allParams,
//            HttpServletRequest httpRequest) {
//
//        log.info("📥 VNPay IPN received");
//
//        try {
//            VnPayCallbackDTO callbackDto = VnPayCallbackMapper.fromParams(allParams);
//            PaymentResult result = paymentService.processPaymentCallback(
//                    PaymentGatewayEnum.VNPAY,
//                    callbackDto,
//                    httpRequest
//            );
//
//            Map<String, String> response = new HashMap<>();
//            if (result.isSuccess()) {
//                response.put("RspCode", "00");
//                response.put("Message", "Confirm Success");
//            } else {
//                response.put("RspCode", "99");
//                response.put("Message", result.message());
//            }
//            return ResponseEntity.ok(response);
//        } catch (Exception e) {
//            log.error("Error processing VNPay IPN", e);
//            Map<String, String> response = new HashMap<>();
//            response.put("RspCode", "99");
//            response.put("Message", "Unknown error");
//            return ResponseEntity.ok(response);
//        }
//    }
//
//    private String getClientIp(HttpServletRequest request) {
//        String ipAddress = request.getHeader("X-Forwarded-For");
//        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
//            ipAddress = request.getHeader("Proxy-Client-IP");
//        }
//        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
//            ipAddress = request.getHeader("WL-Proxy-Client-IP");
//        }
//        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
//            ipAddress = request.getRemoteAddr();
//        }
//        return ipAddress;
//    }
//}

package fpt.teddypet.application.port.input.payment;

import fpt.teddypet.application.dto.response.payment.PaymentResult;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

public interface PaymentService {

    String initiatePayment(UUID orderId, PaymentGatewayEnum gateway, String returnUrl, String ipAddress);

    /**
     * Hủy link PayOS đang treo cho một đơn hàng (best-effort).
     * Dùng khi user bấm "hủy/đóng" nhưng PayOS không nhận được cancel (back/tắt trình duyệt).
     */
    boolean cancelPayosPaymentLink(UUID orderId);

    PaymentResult processPaymentCallback(PaymentGatewayEnum gateway, Object callbackData,
                                         HttpServletRequest request);

    void validateOrderForPayment(Order order);
}

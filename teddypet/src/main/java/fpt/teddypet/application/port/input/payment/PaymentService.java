package fpt.teddypet.application.port.input.payment;

import fpt.teddypet.application.dto.response.payment.PaymentResult;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

public interface PaymentService {

    String initiatePayment(UUID orderId, PaymentGatewayEnum gateway, String returnUrl, String ipAddress);

    PaymentResult processPaymentCallback(PaymentGatewayEnum gateway, Object callbackData,
                                         HttpServletRequest request);

    void validateOrderForPayment(Order order);
}

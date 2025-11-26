package fpt.teddypet.application.port.output.payment;

import fpt.teddypet.application.dto.response.payment.GatewayCallbackResult;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.payments.PaymentGatewayEnum;
import fpt.teddypet.domain.enums.payments.PaymentMethodEnum;
import jakarta.servlet.http.HttpServletRequest;

public interface PaymentGatewayPort<T> {
    PaymentGatewayEnum getGateway();
    default PaymentMethodEnum getPaymentMethod() {
        return getGateway().getPaymentMethod();
    }
    String buildPaymentUrl(Order order, String ipAddress, String returnUrl);
    GatewayCallbackResult handleCallback(T callbackData, HttpServletRequest request);
}

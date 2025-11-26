package fpt.teddypet.application.dto.response.payment;

import fpt.teddypet.domain.enums.payments.PaymentMethodEnum;
import fpt.teddypet.domain.enums.payments.PaymentStatusEnum;

import java.math.BigDecimal;

public record PaymentOrderResponse(
    String paymentUrl,
    String orderCode,
    BigDecimal amount,
    PaymentStatusEnum status,
    PaymentMethodEnum paymentMethod
) {
}

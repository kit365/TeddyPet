package fpt.teddypet.application.dto.response.orders.order;

import fpt.teddypet.application.dto.response.UserOrderInfoResponse;


import fpt.teddypet.application.dto.response.payment.PaymentOrderResponse;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.orders.OrderTypeEnum;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        String orderCode,
        UserOrderInfoResponse user,
        BigDecimal subtotal,
        BigDecimal shippingFee,
        BigDecimal discountAmount,
        String voucherCode,
        BigDecimal finalAmount,
        OrderTypeEnum orderType,
        OrderStatusEnum status,
        String shippingAddress,
        String shippingPhone,
        String shippingName,
        String notes,
        List<OrderItemResponse> orderItems,
        List<PaymentOrderResponse> payments
) {
}

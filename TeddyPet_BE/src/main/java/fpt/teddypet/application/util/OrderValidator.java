package fpt.teddypet.application.util;

import fpt.teddypet.application.constants.payments.PaymentConstants;
import fpt.teddypet.application.exception.PaymentException;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;

import java.math.BigDecimal;

public final class OrderValidator {

    private OrderValidator() {

    }

    public static void validateForPayment(Order order) {
        if (order == null) {
            throw new PaymentException.OrderValidationException(PaymentConstants.Messages.ORDER_NOT_FOUND);
        }
        if (order.getStatus() == OrderStatusEnum.CANCELLED) {
            throw new PaymentException.OrderValidationException(PaymentConstants.Messages.ORDER_CANCELLED);
        }
        if (order.getStatus() == OrderStatusEnum.PENDING) {
            throw new PaymentException.OrderValidationException(
                    "Đơn hàng đang chờ quản lý xác nhận phí vận chuyển. Vui lòng thanh toán sau!");
        }
        if (order.getStatus() == OrderStatusEnum.COMPLETED) {
            throw new PaymentException.OrderValidationException(PaymentConstants.Messages.ORDER_ALREADY_PAID);
        }
        if (order.getFinalAmount() == null || order.getFinalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new PaymentException.OrderValidationException(PaymentConstants.Messages.ORDER_INVALID_AMOUNT);
        }
    }
}

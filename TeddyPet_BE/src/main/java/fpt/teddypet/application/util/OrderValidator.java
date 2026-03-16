package fpt.teddypet.application.util;

import fpt.teddypet.application.constants.payments.PaymentConstants;
import fpt.teddypet.application.exception.PaymentException;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.orders.OrderTypeEnum;

import java.math.BigDecimal;

public final class OrderValidator {

    private OrderValidator() {

    }

    /**
     * Cho phép thanh toán khi đơn ONLINE (đặt trên web) đang PENDING.
     * Chỉ chặn khi đơn OFFLINE (tại quầy) PENDING - cần admin xác nhận phí vận chuyển trước.
     */
    public static void validateForPayment(Order order) {
        if (order == null) {
            throw new PaymentException.OrderValidationException(PaymentConstants.Messages.ORDER_NOT_FOUND);
        }
        if (order.getStatus() == OrderStatusEnum.CANCELLED) {
            throw new PaymentException.OrderValidationException(PaymentConstants.Messages.ORDER_CANCELLED);
        }
        if (order.getStatus() == OrderStatusEnum.PENDING && order.getOrderType() == OrderTypeEnum.OFFLINE) {
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

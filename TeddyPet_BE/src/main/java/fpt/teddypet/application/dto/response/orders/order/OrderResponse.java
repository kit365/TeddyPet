package fpt.teddypet.application.dto.response.orders.order;

import fpt.teddypet.application.dto.response.UserOrderInfoResponse;

import fpt.teddypet.application.dto.response.payment.PaymentOrderResponse;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.domain.enums.orders.OrderTypeEnum;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
                UUID id,
                String orderCode,
                UserOrderInfoResponse user, // null nếu guest checkout
                Long userAddressId, // ID của địa chỉ đã lưu (null nếu nhập thủ công hoặc guest)
                String guestEmail, // Email của guest (null nếu user đăng nhập)
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
                List<PaymentOrderResponse> payments,
                LocalDateTime createdAt,
                LocalDateTime updatedAt) {
}

package fpt.teddypet.application.port.output.payment;


import fpt.teddypet.domain.entity.Payment;
import fpt.teddypet.domain.enums.payments.PaymentStatusEnum;

import java.util.Optional;
import java.util.UUID;

/**
 * Output port for Payment persistence operations
 */
public interface PaymentRepositoryPort {

    Payment save(Payment payment);

    Optional<Payment> findById(UUID id);

    Optional<Payment> findByTransactionId(String transactionId);

    Optional<Payment> findByOrderId(UUID orderId);

    /** Tìm payment PENDING theo order và gateway (để lấy lại checkoutUrl khi PayOS báo đơn đã tồn tại). */
    Optional<Payment> findFirstByOrderIdAndPaymentGatewayAndStatusOrderByCreatedAtDesc(
            UUID orderId, String paymentGateway, PaymentStatusEnum status);

    Long getNextOrderCode();
}

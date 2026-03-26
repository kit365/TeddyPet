package fpt.teddypet.infrastructure.persistence.postgres.repository.payment;


import fpt.teddypet.domain.entity.Payment;
import fpt.teddypet.domain.enums.payments.PaymentStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    // Có thể tồn tại nhiều bản ghi cùng transactionId (nhiều lần tạo/ retry) → dùng firstBy...orderByCreatedAtDesc
    Optional<Payment> findFirstByTransactionIdOrderByCreatedAtDesc(String transactionId);

    Optional<Payment> findByOrderId(UUID orderId);

    Optional<Payment> findFirstByOrderIdAndPaymentGatewayAndStatusOrderByCreatedAtDesc(
            UUID orderId, String paymentGateway, PaymentStatusEnum status);

    @Query(value = "SELECT nextval('payment_order_code_seq')", nativeQuery = true)
    Long getNextOrderCode();
}

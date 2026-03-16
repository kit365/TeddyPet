package fpt.teddypet.infrastructure.adapter.payment;

import fpt.teddypet.application.port.output.payment.PaymentRepositoryPort;
import fpt.teddypet.domain.entity.Payment;
import fpt.teddypet.domain.enums.payments.PaymentStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.payment.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PaymentRepositoryAdapter implements PaymentRepositoryPort {

    private final PaymentRepository paymentRepository;

    @Override
    public Payment save(Payment payment) {
        return paymentRepository.save(payment);
    }

    @Override
    public Optional<Payment> findById(UUID id) {
        return paymentRepository.findById(id);
    }

    @Override
    public Optional<Payment> findByTransactionId(String transactionId) {
        // Khi có nhiều bản ghi cùng transactionId, luôn lấy bản ghi mới nhất
        return paymentRepository.findFirstByTransactionIdOrderByCreatedAtDesc(transactionId);
    }

    @Override
    public Optional<Payment> findByOrderId(UUID orderId) {
        return paymentRepository.findByOrderId(orderId);
    }

    @Override
    public Optional<Payment> findFirstByOrderIdAndPaymentGatewayAndStatusOrderByCreatedAtDesc(
            UUID orderId, String paymentGateway, PaymentStatusEnum status) {
        return paymentRepository.findFirstByOrderIdAndPaymentGatewayAndStatusOrderByCreatedAtDesc(
                orderId, paymentGateway, status);
    }
}

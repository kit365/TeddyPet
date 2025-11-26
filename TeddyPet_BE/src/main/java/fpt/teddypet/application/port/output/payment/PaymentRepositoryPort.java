package fpt.teddypet.application.port.output.payment;


import fpt.teddypet.domain.entity.Payment;

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
}

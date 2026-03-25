package fpt.teddypet.infrastructure.adapter.payment;

import fpt.teddypet.application.port.output.payment.PaymentOrderCodePort;
import fpt.teddypet.application.port.output.payment.PaymentRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PaymentOrderCodeAdapter implements PaymentOrderCodePort {

    private final PaymentRepositoryPort paymentRepositoryPort;

    @Override
    public long getNext() {
        // Use database sequence to guarantee uniqueness across DB resets and nodes
        return paymentRepositoryPort.getNextOrderCode();
    }
}

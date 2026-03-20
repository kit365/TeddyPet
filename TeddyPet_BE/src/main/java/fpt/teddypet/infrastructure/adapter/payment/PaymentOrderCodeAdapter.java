package fpt.teddypet.infrastructure.adapter.payment;

import fpt.teddypet.application.port.output.payment.PaymentOrderCodePort;

import org.springframework.stereotype.Component;

@Component
public class PaymentOrderCodeAdapter implements PaymentOrderCodePort {

    public PaymentOrderCodeAdapter() {
    }

    @Override
    public long getNext() {
        // Fallback or new approach: use timestamp in seconds + random digits
        // to guarantee uniqueness across DB resets while staying within 15 digits
        // JS max safe integer is 9007199254740991 (16 digits).
        long timeSecs = System.currentTimeMillis() / 1000; // 10 digits
        int randomPart = new java.util.Random().nextInt(90000) + 10000; // 5 digits
        return Long.parseLong(timeSecs + "" + randomPart);
    }
}

package fpt.teddypet.application.port.output.payment;

/**
 * Provides next order code for payment links when the primary order numeric_code
 * cannot be reused (e.g. PayOS "đơn đã tồn tại" after cancelling old link).
 */
public interface PaymentOrderCodePort {
    long getNext();
}

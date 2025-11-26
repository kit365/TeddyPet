package fpt.teddypet.application.exception;

public class PaymentException extends RuntimeException {
    
    public PaymentException(String message) {
        super(message);
    }
    
    public PaymentException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public static class InvalidSignatureException extends PaymentException {
        public InvalidSignatureException(String message) {
            super(message);
        }
    }
    
    public static class GatewayNotSupportedException extends PaymentException {
        public GatewayNotSupportedException(String gateway) {
            super("Gateway not supported: " + gateway);
        }
    }
    
    public static class PaymentNotFoundException extends PaymentException {
        public PaymentNotFoundException(String transactionId) {
            super("Payment not found: " + transactionId);
        }
    }
    
    public static class OrderValidationException extends PaymentException {
        public OrderValidationException(String message) {
            super(message);
        }
    }
}

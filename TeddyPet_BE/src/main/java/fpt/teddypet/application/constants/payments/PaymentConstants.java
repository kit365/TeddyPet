package fpt.teddypet.application.constants.payments;

public final class PaymentConstants {

    private PaymentConstants() {

    }

    
    // Messages
    public static final class Messages {
        // Success
        public static final String PAYMENT_SUCCESS = "Thanh toán thành công";
        public static final String PAYMENT_FAILED = "Thanh toán thất bại";
        public static final String PAYMENT_INITIATED = "✅ Payment initiated: gateway={}, orderId={}, amount={}";
        public static final String PAYMENT_COMPLETED = "✅ Payment completed: gateway={}, txnId={}, orderId={}";
        
        // Errors
        public static final String ORDER_NOT_FOUND = "Order không tồn tại";
        public static final String ORDER_CANCELLED = "Order đã bị hủy";
        public static final String ORDER_ALREADY_PAID = "Order đã được thanh toán";
        public static final String ORDER_INVALID_AMOUNT = "Order chưa có giá hợp lệ";
        public static final String PAYMENT_NOT_FOUND = "Payment not found: {}";
        public static final String GATEWAY_NOT_SUPPORTED = "Gateway not supported: {}";
        public static final String INVALID_SIGNATURE = "Chữ ký không hợp lệ";
        public static final String CANNOT_CREATE_PAYMENT_URL = "Cannot create payment URL: {}";
        
        // Logs
        public static final String LOG_CALLBACK_RECEIVED = "🔔 {} callback: txnRef={}, status={}";
        public static final String LOG_INVALID_SIGNATURE = "❌ Invalid signature for txnRef: {}";
        public static final String LOG_ERROR_BUILDING_URL = "❌ Error building gateway URL";
        public static final String LOG_PAYMENT_FAILED_WARN = "⚠️ Payment failed: gateway={}, txnId={}";
        public static final String LOG_QUERY_STRING_ERROR = "❌ Cannot get raw query string from request";
        public static final String LOG_DUPLICATE_CALLBACK = "⚠️ Duplicate callback detected for txnId: {}, current status: {}";
        public static final String LOG_TYPE_MISMATCH = "❌ Callback data type mismatch for gateway: {}";
        public static final String LOG_INVALID_SIGNATURE_SHORT = "❌ Invalid signature from {}";
        
        // Message templates
        public static final String MSG_PAYMENT_INITIATED = "Initiated payment via ";
        public static final String MSG_PAYMENT_COMPLETED = "Payment completed via ";
        public static final String MSG_PAYMENT_FAILED_PREFIX = "Payment failed: ";
        
        private Messages() {}
    }
    
    // Numeric constants
    public static final class Numeric {
        public static final int AMOUNT_MULTIPLIER = 100; // General multiplier
        public static final int AMOUNT_DECIMAL_SCALE = 2; // Decimal places for amount
        public static final int COGNITIVE_COMPLEXITY_LIMIT = 15;
        
        private Numeric() {}
    }
}

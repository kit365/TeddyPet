package fpt.teddypet.application.constants.payments;

public final class PaymentConstants {

    private PaymentConstants() {

    }

    // VNPay constants
    public static final class VNPay {
        public static final String VERSION = "2.1.0";
        public static final String COMMAND_PAY = "pay";
        public static final String CURRENCY_VND = "VND";
        public static final String ORDER_TYPE_OTHER = "other";
        public static final String LOCALE_VN = "vn";
        public static final String TIMEZONE = "Etc/GMT+7";
        public static final String DATE_FORMAT = "yyyyMMddHHmmss";
        public static final String SUCCESS_CODE = "00";
        public static final int TRANSACTION_REF_LENGTH = 8;
        
        public static final String PARAM_SECURE_HASH = "vnp_SecureHash";
        public static final String PARAM_SECURE_HASH_TYPE = "vnp_SecureHashType";
        
   
        public static final String FIELD_TXN_REF = "vnp_TxnRef";
        public static final String FIELD_AMOUNT = "vnp_Amount";
        public static final String FIELD_ORDER_INFO = "vnp_OrderInfo";
        public static final String FIELD_RESPONSE_CODE = "vnp_ResponseCode";
        public static final String FIELD_TRANSACTION_NO = "vnp_TransactionNo";
        public static final String FIELD_BANK_CODE = "vnp_BankCode";
        public static final String FIELD_PAY_DATE = "vnp_PayDate";
        public static final String FIELD_TRANSACTION_STATUS = "vnp_TransactionStatus";
        
  
        public static final String PARAM_VERSION = "vnp_Version";
        public static final String PARAM_COMMAND = "vnp_Command";
        public static final String PARAM_TMN_CODE = "vnp_TmnCode";
        public static final String PARAM_AMOUNT = "vnp_Amount";
        public static final String PARAM_CURR_CODE = "vnp_CurrCode";
        public static final String PARAM_TXN_REF = "vnp_TxnRef";
        public static final String PARAM_ORDER_INFO = "vnp_OrderInfo";
        public static final String PARAM_ORDER_TYPE = "vnp_OrderType";
        public static final String PARAM_LOCALE = "vnp_Locale";
        public static final String PARAM_RETURN_URL = "vnp_ReturnUrl";
        public static final String PARAM_IP_ADDR = "vnp_IpAddr";
        public static final String PARAM_CREATE_DATE = "vnp_CreateDate";
        

        public static final String URL_SEPARATOR = "&";
        public static final String URL_EQUALS = "=";
        public static final String URL_QUERY_START = "?";
        public static final String URL_SECURE_HASH_PARAM = "&vnp_SecureHash=";
        
        private VNPay() {}
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
        public static final String CANNOT_CREATE_PAYMENT_URL = "Cannot create VNPay payment URL: {}";
        
        // Logs
        public static final String LOG_CALLBACK_RECEIVED = "🔔 {} callback: txnRef={}, status={}";
        public static final String LOG_INVALID_SIGNATURE = "❌ Invalid signature for txnRef: {}";
        public static final String LOG_ERROR_BUILDING_URL = "❌ Error building VNPay URL";
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
        public static final int AMOUNT_MULTIPLIER = 100; // VNPay amount in cents
        public static final int AMOUNT_DECIMAL_SCALE = 2; // Decimal places for amount
        public static final int COGNITIVE_COMPLEXITY_LIMIT = 15;
        
        private Numeric() {}
    }
}

package fpt.teddypet.application.dto.request.payments;


import fpt.teddypet.application.constants.payments.PaymentConstants;
import lombok.Builder;

import java.util.LinkedHashMap;
import java.util.Map;

@Builder
public record VnPayCallbackDTO(
        String vnp_TxnRef,
        String vnp_Amount,
        String vnp_OrderInfo,
        String vnp_ResponseCode,
        String vnp_TransactionNo,
        String vnp_BankCode,
        String vnp_PayDate,
        String vnp_TransactionStatus,
        String vnp_SecureHash
) implements PaymentCallbackRequest {

    @Override
    public Map<String, String> toMap() {
        Map<String, String> map = new LinkedHashMap<>();
        if (vnp_TxnRef != null) map.put(PaymentConstants.VNPay.FIELD_TXN_REF, vnp_TxnRef);
        if (vnp_Amount != null) map.put(PaymentConstants.VNPay.FIELD_AMOUNT, vnp_Amount);
        if (vnp_OrderInfo != null) map.put(PaymentConstants.VNPay.FIELD_ORDER_INFO, vnp_OrderInfo);
        if (vnp_ResponseCode != null) map.put(PaymentConstants.VNPay.FIELD_RESPONSE_CODE, vnp_ResponseCode);
        if (vnp_TransactionNo != null) map.put(PaymentConstants.VNPay.FIELD_TRANSACTION_NO, vnp_TransactionNo);
        if (vnp_BankCode != null) map.put(PaymentConstants.VNPay.FIELD_BANK_CODE, vnp_BankCode);
        if (vnp_PayDate != null) map.put(PaymentConstants.VNPay.FIELD_PAY_DATE, vnp_PayDate);
        if (vnp_TransactionStatus != null) map.put(PaymentConstants.VNPay.FIELD_TRANSACTION_STATUS, vnp_TransactionStatus);
        return map;
    }
    
    @Override
    public String getTransactionRef() {
        return vnp_TxnRef;
    }
    
    @Override
    public String getTransactionStatus() {
        return vnp_TransactionStatus;
    }
    
    @Override
    public String getSecureHash() {
        return vnp_SecureHash;
    }
}

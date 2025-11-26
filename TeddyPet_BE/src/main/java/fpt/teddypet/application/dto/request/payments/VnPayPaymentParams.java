package fpt.teddypet.application.dto.request.payments;


import fpt.teddypet.application.constants.payments.PaymentConstants;
import lombok.Builder;
import lombok.Getter;

import java.util.LinkedHashMap;
import java.util.Map;


@Getter
@Builder
public class VnPayPaymentParams {
    
    // VNPay constants
    @Builder.Default
    private final String version = PaymentConstants.VNPay.VERSION;
    
    @Builder.Default
    private final String command = PaymentConstants.VNPay.COMMAND_PAY;
    
    @Builder.Default
    private final String currCode = PaymentConstants.VNPay.CURRENCY_VND;
    
    @Builder.Default
    private final String orderType = PaymentConstants.VNPay.ORDER_TYPE_OTHER;
    
    @Builder.Default
    private final String locale = PaymentConstants.VNPay.LOCALE_VN;

    private final String tmnCode;
    private final Long amount;
    private final String txnRef;
    private final String orderInfo;
    private final String returnUrl;
    private final String ipAddr;
    private final String createDate;
    

    public Map<String, String> toParamsMap() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put(PaymentConstants.VNPay.PARAM_VERSION, version);
        params.put(PaymentConstants.VNPay.PARAM_COMMAND, command);
        params.put(PaymentConstants.VNPay.PARAM_TMN_CODE, tmnCode);
        params.put(PaymentConstants.VNPay.PARAM_AMOUNT, String.valueOf(amount));
        params.put(PaymentConstants.VNPay.PARAM_CURR_CODE, currCode);
        params.put(PaymentConstants.VNPay.PARAM_TXN_REF, txnRef);
        params.put(PaymentConstants.VNPay.PARAM_ORDER_INFO, orderInfo);
        params.put(PaymentConstants.VNPay.PARAM_ORDER_TYPE, orderType);
        params.put(PaymentConstants.VNPay.PARAM_LOCALE, locale);
        params.put(PaymentConstants.VNPay.PARAM_RETURN_URL, returnUrl);
        params.put(PaymentConstants.VNPay.PARAM_IP_ADDR, ipAddr);
        params.put(PaymentConstants.VNPay.PARAM_CREATE_DATE, createDate);
        return params;
    }
}

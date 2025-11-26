package fpt.teddypet.application.mapper.payments;

import fpt.teddypet.application.constants.payments.PaymentConstants;
import fpt.teddypet.application.dto.request.payments.VnPayCallbackDTO;

import java.util.Map;


public class VnPayCallbackMapper {

    private VnPayCallbackMapper() {
        // Utility class
    }

    /**
     * Map from query parameters to VnPayCallbackDTO
     */
    public static VnPayCallbackDTO fromParams(Map<String, String> params) {
        if (params == null) {
            return null;
        }

        return new VnPayCallbackDTO(
                params.get(PaymentConstants.VNPay.FIELD_TXN_REF),
                params.get(PaymentConstants.VNPay.FIELD_AMOUNT),
                params.get(PaymentConstants.VNPay.FIELD_ORDER_INFO),
                params.get(PaymentConstants.VNPay.FIELD_RESPONSE_CODE),
                params.get(PaymentConstants.VNPay.FIELD_TRANSACTION_NO),
                params.get(PaymentConstants.VNPay.FIELD_BANK_CODE),
                params.get(PaymentConstants.VNPay.FIELD_PAY_DATE),
                params.get(PaymentConstants.VNPay.FIELD_TRANSACTION_STATUS),
                params.get(PaymentConstants.VNPay.PARAM_SECURE_HASH)
        );
    }
}

package fpt.teddypet.application.dto.response.payment;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Result of building a payment URL. When transactionId is set, the caller must use it
 * for the Payment record (e.g. PayOS recreate-after-cancel uses a new orderCode).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BuildPaymentUrlResult {
    private String checkoutUrl;
    /** If non-null, use this as Payment.transactionId instead of order.numericCode. */
    private String transactionId;

    public static BuildPaymentUrlResult of(String checkoutUrl) {
        return new BuildPaymentUrlResult(checkoutUrl, null);
    }

    public static BuildPaymentUrlResult of(String checkoutUrl, String transactionId) {
        return new BuildPaymentUrlResult(checkoutUrl, transactionId);
    }
}

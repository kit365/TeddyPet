package fpt.teddypet.domain.enums.payments;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentGatewayEnum {
    PAYOS("PayOS", "VietQR Banking payment via PayOS", GatewayCategory.BANK_TRANSFER, PaymentMethodEnum.BANK_TRANSFER);

    private final String displayName;
    private final String description;
    private final GatewayCategory category;
    private final PaymentMethodEnum paymentMethod;

    @Getter
    @RequiredArgsConstructor
    public enum GatewayCategory {
        BANK_TRANSFER("Bank Transfer");

        private final String displayName;
    }
}

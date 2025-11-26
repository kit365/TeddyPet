package fpt.teddypet.domain.enums.payments;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentGatewayEnum {
    VNPAY("VNPay", "VNPay Payment Gateway", GatewayCategory.E_WALLET, PaymentMethodEnum.E_WALLET),
    MOMO("Momo", "Momo E-Wallet", GatewayCategory.E_WALLET, PaymentMethodEnum.E_WALLET),
    ZALOPAY("ZaloPay", "ZaloPay E-Wallet", GatewayCategory.E_WALLET, PaymentMethodEnum.E_WALLET),
    PAYPAL("PayPal", "PayPal International", GatewayCategory.INTERNATIONAL, PaymentMethodEnum.CREDIT_CARD),
    STRIPE("Stripe", "Stripe Payment", GatewayCategory.INTERNATIONAL, PaymentMethodEnum.CREDIT_CARD);

    private final String displayName;
    private final String description;
    private final GatewayCategory category;
    private final PaymentMethodEnum paymentMethod;
    
    @Getter
    @RequiredArgsConstructor
    public enum GatewayCategory {
        E_WALLET("E-Wallet"),
        INTERNATIONAL("International Payment"),
        BANK_TRANSFER("Bank Transfer");
        
        private final String displayName;
    }
}

package fpt.teddypet.config;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class VnPayConfig {

    @Value("${payment.vnpay.tmn-code}")
    private String tmnCode;

    @Value("${payment.vnpay.hash-secret}")
    private String hashSecret;

    @Value("${payment.vnpay.url}")
    private String payUrl;

    @Value("${payment.vnpay.return-url}")
    private String returnUrlTemplate;

    @Value("${spring.application.url:}")
    private String baseUrl;

    public String getReturnUrl() {
        if (returnUrlTemplate != null && !returnUrlTemplate.isEmpty()) {
            return returnUrlTemplate;
        }
        return baseUrl + "/api/payment/vnpay/callback";
    }
}

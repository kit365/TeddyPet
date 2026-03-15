package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.domain.entity.ShippingRule;
import fpt.teddypet.infrastructure.persistence.postgres.repository.shipping.ShippingRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
@Order(15)
@RequiredArgsConstructor
public class ShippingRuleDataInit implements CommandLineRunner {

    private final ShippingRuleRepository shippingRuleRepository;

    @Override
    public void run(String... args) {
        initializeShippingRule();
    }

    private void initializeShippingRule() {
        if (shippingRuleRepository.count() > 0) {
            log.debug("Shipping rules already exist, skip init.");
            return;
        }
        log.info("Initializing default Shipping Rule (phí vận chuyển)...");

        ShippingRule rule = ShippingRule.builder()
                .isInnerCity(true)
                .provinceId(79) // Hồ Chí Minh
                .districtId(null)
                .fixedFee(new BigDecimal("30000"))
                .maxInternalDistanceKm(10.0)
                .feePerKm(new BigDecimal("5000"))
                .freeShipThreshold(new BigDecimal("500000"))
                .note("Mặc định nội thành - dữ liệu khởi tạo")
                .minFee(new BigDecimal("20000"))
                .baseWeight(1.0)
                .overWeightFee(new BigDecimal("5000"))
                .freeShipDistanceKm(2.0)
                .isSelfShip(true)
                .build();

        shippingRuleRepository.save(rule);
        log.info("Created 1 default shipping rule (provinceId=79, feePerKm=5000, minFee=20000).");
    }
}

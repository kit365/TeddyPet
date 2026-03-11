package fpt.teddypet.infrastructure.persistence.postgres.data;

import fpt.teddypet.domain.entity.BookingDepositRefundPolicy;
import fpt.teddypet.infrastructure.persistence.postgres.repository.bookings.BookingDepositRefundPolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
@Order(11)
@RequiredArgsConstructor
public class BookingDepositRefundPolicyDataInitializer implements CommandLineRunner {

    private final BookingDepositRefundPolicyRepository bookingDepositRefundPolicyRepository;

    @Value("${data.init.refundPolicies.enabled:true}")
    private boolean enabled;

    @Override
    public void run(String... args) {
        if (!enabled) {
            log.info("Refund policy data init disabled (data.init.refundPolicies.enabled=false)");
            return;
        }
        if (!bookingDepositRefundPolicyRepository.findAllNotDeletedOrderByDisplayOrder().isEmpty()) {
            return;
        }

        BookingDepositRefundPolicy standard = BookingDepositRefundPolicy.builder()
                .policyName("Chính sách tiêu chuẩn")
                .description("Chính sách hoàn cọc mặc định")
                .depositPercentage(new BigDecimal("25.00"))
                .fullRefundHours(48)
                .fullRefundPercentage(new BigDecimal("100.00"))
                .partialRefundHours(24)
                .partialRefundPercentage(new BigDecimal("50.00"))
                .noRefundHours(12)
                .noRefundPercentage(new BigDecimal("0.00"))
                .noShowRefundPercentage(new BigDecimal("0.00"))
                .noShowPenalty(BigDecimal.ZERO)
                .allowForceMajeure(true)
                .forceMajeureRefundPercentage(new BigDecimal("100.00"))
                .forceMajeureRequiresEvidence(true)
                .isDefault(true)
                .displayOrder(0)
                .highlightText("Miễn phí hủy trước 48 giờ!")
                .isActive(true)
                .isDeleted(false)
                .build();

        bookingDepositRefundPolicyRepository.save(standard);
        log.info("✅ Seeded default booking deposit refund policy");
    }
}


package fpt.teddypet.application.dto.response.service.pricing;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ServicePricingInfo(
        Long pricingId,
        Long serviceId,
        String pricingName,
        BigDecimal price,
        Integer priority,
        LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo,
        @JsonProperty("isActive")
        boolean isActive
) {
}

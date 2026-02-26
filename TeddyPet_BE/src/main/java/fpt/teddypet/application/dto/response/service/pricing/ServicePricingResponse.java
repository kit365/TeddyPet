package fpt.teddypet.application.dto.response.service.pricing;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ServicePricingResponse(
        Long pricingId,
        Long serviceId,
        String suitablePetTypes,
        String pricingName,
        BigDecimal price,
        BigDecimal weekendMultiplier,
        BigDecimal peakSeasonMultiplier,
        BigDecimal holidayMultiplier,
        BigDecimal minWeight,
        BigDecimal maxWeight,
        LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo,
        Integer priority,
        @JsonProperty("isActive")
        boolean isActive,
        boolean isDeleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String createdBy,
        String updatedBy
) {
}

package fpt.teddypet.application.dto.response.shipping;

import java.math.BigDecimal;

public record ShippingRuleResponse(
                Long id,
                Boolean isInnerCity,
                Integer provinceId,
                Integer districtId,
                BigDecimal fixedFee,
                Double maxInternalDistanceKm,
                BigDecimal feePerKm,
                BigDecimal freeShipThreshold,
                String note,
                BigDecimal minFee,
                Double baseWeight,
                BigDecimal overWeightFee) {
}

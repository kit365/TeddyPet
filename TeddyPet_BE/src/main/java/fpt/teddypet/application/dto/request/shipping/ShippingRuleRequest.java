package fpt.teddypet.application.dto.request.shipping;

import java.math.BigDecimal;

public record ShippingRuleRequest(
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
        BigDecimal overWeightFee,
        Double freeShipDistanceKm,
        Boolean isSelfShip) {
}

package fpt.teddypet.application.dto.response.shipping;

import java.math.BigDecimal;

public record ShippingSuggestionResponse(
                BigDecimal amount,
                String status, // "IN_RANGE", "OUT_OF_RANGE", "FREE_SHIP", "UNKNOWN_RULE"
                Double distance,
                BigDecimal feePerKm,
                BigDecimal overWeightFee,
                Double baseWeight) {
}

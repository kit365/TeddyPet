package fpt.teddypet.application.dto.response.shipping;

import java.math.BigDecimal;

public record ShippingSuggestionResponse(
        BigDecimal amount,
        String status, // "IN_RANGE" or "OUT_OF_RANGE"
        Double distance) {
}

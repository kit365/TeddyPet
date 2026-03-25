package fpt.teddypet.application.dto.response.dashboard;

import java.math.BigDecimal;

public record SalesByCategoryResponse(
    String categoryName,
    long count,
    BigDecimal revenue
) {}

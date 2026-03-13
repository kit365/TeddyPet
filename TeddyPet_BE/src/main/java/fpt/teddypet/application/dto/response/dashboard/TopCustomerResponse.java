package fpt.teddypet.application.dto.response.dashboard;

import java.math.BigDecimal;

public record TopCustomerResponse(
    String fullName,
    String email,
    String avatarUrl,
    long totalOrders,
    BigDecimal totalSpent
) {}

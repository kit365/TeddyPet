package fpt.teddypet.application.dto.response.dashboard;

import java.math.BigDecimal;

public record RevenueChartItem(
        String label,
        BigDecimal revenue,
        long orders) {
}

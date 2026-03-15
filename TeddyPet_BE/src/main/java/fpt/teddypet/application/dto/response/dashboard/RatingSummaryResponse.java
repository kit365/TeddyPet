package fpt.teddypet.application.dto.response.dashboard;

import java.math.BigDecimal;

/** Tổng hợp đánh giá: điểm trung bình + số lượt đánh giá. */
public record RatingSummaryResponse(
        BigDecimal averageScore,
        long totalCount
) {}

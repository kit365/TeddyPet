package fpt.teddypet.application.dto.response.feedback;

import java.math.BigDecimal;
import java.util.Map;

public record FeedbackStatsResponse(
    long totalReviews,
    double averageRating,
    long todayReviews,
    BigDecimal ratingGrowth, // Percentage growth compared to last month
    Map<Integer, Long> ratingDistribution, // 1 to 5 stars
    java.util.List<MonthlyReviewCount> monthlyTrends
) {
    public record MonthlyReviewCount(String month, long count) {}
}

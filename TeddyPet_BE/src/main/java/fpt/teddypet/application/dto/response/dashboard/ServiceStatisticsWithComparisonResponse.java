package fpt.teddypet.application.dto.response.dashboard;

import java.util.List;

/** Thống kê dịch vụ theo năm + so sánh với năm trước. */
public record ServiceStatisticsWithComparisonResponse(
        List<ServiceStatisticsResponse> months,
        long totalThisYear,
        long totalLastYear,
        double percentChange
) {}

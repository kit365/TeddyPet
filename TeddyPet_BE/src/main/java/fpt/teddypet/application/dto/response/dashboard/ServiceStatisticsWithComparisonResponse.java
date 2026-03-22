package fpt.teddypet.application.dto.response.dashboard;

import java.util.List;

/** Thống kê dịch vụ theo năm + so sánh với năm trước. */
public record ServiceStatisticsWithComparisonResponse(
        /** Dịch vụ đang hoạt động (thứ tự hiển thị); {@code serviceCounts} trong từng tháng dùng key = {@code String.valueOf(serviceId)}. */
        List<ServiceStatisticsSeriesInfo> services,
        List<ServiceStatisticsResponse> months,
        long totalThisYear,
        long totalLastYear,
        double percentChange
) {}

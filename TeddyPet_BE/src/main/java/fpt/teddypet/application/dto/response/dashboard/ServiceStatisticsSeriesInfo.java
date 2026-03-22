package fpt.teddypet.application.dto.response.dashboard;

/** Một dòng chuỗi trên biểu đồ thống kê dịch vụ (theo dịch vụ thật trong hệ thống). */
public record ServiceStatisticsSeriesInfo(
        long serviceId,
        String name
) {}

package fpt.teddypet.application.dto.response.dashboard;

import java.util.List;

/** Tăng trưởng thành viên: đăng ký mới theo từng tháng (năm nay vs năm trước). */
public record CustomerGrowthResponse(
        List<Long> thisYearMonthly,
        List<Long> lastYearMonthly,
        String[] monthLabels
) {}

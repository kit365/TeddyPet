package fpt.teddypet.application.dto.response.dashboard;

import java.util.Map;

public record ServiceStatisticsResponse(
    String month,
    Map<String, Long> serviceCounts
) {}

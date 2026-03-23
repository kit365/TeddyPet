package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record NoShowConfigResponse(
        Long id,
        String name,
        Integer gracePeriodMinutes,
        Boolean autoMarkNoShow,
        BigDecimal penaltyAmount,
        Boolean allowLateCheckin,
        Integer lateCheckinMinutes,
        Boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<NoShowServiceSummaryResponse> services,
        /** Số dịch vụ gán (dùng cho danh sách khi không trả full services). */
        Integer linkedServiceCount) {
}

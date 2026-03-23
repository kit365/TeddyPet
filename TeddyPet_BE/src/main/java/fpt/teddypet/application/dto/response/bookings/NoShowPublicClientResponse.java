package fpt.teddypet.application.dto.response.bookings;

import java.math.BigDecimal;

/**
 * Thông tin no-show công khai cho khách đặt lịch (theo dịch vụ), không chứa dữ liệu nội bộ admin.
 */
public record NoShowPublicClientResponse(
        String name,
        Integer gracePeriodMinutes,
        Boolean autoMarkNoShow,
        BigDecimal penaltyAmount,
        Boolean allowLateCheckin,
        Integer lateCheckinMinutes) {
}

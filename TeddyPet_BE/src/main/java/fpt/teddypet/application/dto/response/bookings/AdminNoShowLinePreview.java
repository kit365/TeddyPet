package fpt.teddypet.application.dto.response.bookings;

import java.io.Serializable;

/**
 * Một dòng dịch vụ trong booking: thông tin no-show để admin quyết định check-in hay đánh no-show thủ công.
 */
public record AdminNoShowLinePreview(
        Long bookingPetServiceId,
        String serviceName,
        String noShowConfigName,
        boolean autoMarkNoShow,
        int gracePeriodMinutes,
        boolean allowLateCheckin,
        int lateCheckinMinutes,
        /** Giờ hẹn T0 (ngày gửi + giờ mở cửa), ISO-8601 offset +07:00 */
        String appointmentStartOffset,
        /** Hết thời gian chờ grace (T0 + grace), ISO-8601 */
        String graceEndsAtOffset,
        /** Số phút trễ so với T0 (0 nếu chưa trễ hoặc thiếu dữ liệu) */
        long minutesLateNow,
        /** Kết quả đánh giá nếu check-in ngay bây giờ (ON_TIME_OR_LATE_OK, LATE_BEFORE_NO_SHOW, NO_SHOW, SKIPPED) */
        String outcome,
        String note
) implements Serializable {}

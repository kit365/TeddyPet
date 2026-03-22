package fpt.teddypet.application.dto.response.staff;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record WorkShiftBookingPetServiceItemResponse(
        Long bookingPetServiceId,
        String bookingCode,
        Long bookingId,
        String customerName,
        String petName,
        String serviceName,
        LocalDate bookingDateFrom,
        LocalDateTime scheduledStartTime,
        LocalDateTime scheduledEndTime,
        /** Dịch vụ đơn lẻ có isRequiredRoom = true (combo không set ở đây). */
        Boolean serviceRequiresRoom,
        /** Thời điểm check-in booking — dùng hiển thị trạng thái xếp ca khi serviceRequiresRoom. */
        LocalDateTime bookingCheckInDate,
        /** Từ service.required_staff_count (null nếu combo không map được). */
        Integer requiredStaffCount
) {
}

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
        Integer requiredStaffCount,
        /** Trạng thái booking (PENDING, CONFIRMED, …). */
        String bookingStatus,
        /**
         * Chỉ true khi được phép thêm vào ca: {@code booking_pet_service} PENDING hoặc WAITING_STAFF
         * (và booking chưa hủy / hoàn thành).
         */
        Boolean canAssignToShift,
        /** Loại đặt chỗ (ONLINE, WALK_IN, …) — từ {@code Booking.bookingType}. */
        String bookingType,
        /** Trạng thái dòng dịch vụ — từ {@code BookingPetService.status}. */
        String bookingPetServiceStatus,
        /** Ngày đặt chỗ — ngày khách chọn khi tạo booking ({@code Booking.bookingDateFrom}). */
        LocalDate bookingPlacedDate,
        /**
         * Nhân viên đã gán xử lý dịch vụ (booking_pet_service_staff). Nếu null/rỗng: chưa xếp NV vào ca
         * (dù có thể đã có khung giờ từ đặt lịch).
         */
        String assignedStaffNames
) {
}

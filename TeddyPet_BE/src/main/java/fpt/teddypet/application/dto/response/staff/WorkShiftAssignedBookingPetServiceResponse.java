package fpt.teddypet.application.dto.response.staff;

import java.time.LocalDateTime;

/** Booking_pet_service đã có lịch (overlap) với khoảng thời gian ca. */
public record WorkShiftAssignedBookingPetServiceResponse(
        Long bookingPetServiceId,
        String bookingCode,
        String customerName,
        String petName,
        String serviceName,
        LocalDateTime scheduledStartTime,
        LocalDateTime scheduledEndTime,
        /** Tên nhân viên được gán xử lý (booking_pet_service.assigned_staff), cách nhau bởi dấu phẩy. */
        String assignedStaffNames) {}

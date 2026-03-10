package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Một dịch vụ đặt cho thú cưng (tương ứng 1 bản ghi booking_pet_services).
 * addonServiceIds: dịch vụ add-on (isAddon=true) khách chọn kèm theo dịch vụ chính → lưu vào booking_pet_service_items.
 */
public record CreateBookingPetServiceRequest(
        @NotNull(message = "Dịch vụ là bắt buộc")
        Long serviceId,

        /**
         * Dịch vụ yêu cầu chọn phòng (Hotel) hay không (Spa, Grooming...).
         */
        boolean requiresRoom,

        // Dịch vụ có phòng (Hotel)
        String checkInDate,
        String checkOutDate,
        Long roomId,

        // Dịch vụ không có phòng (Spa)
        String sessionDate,
        String sessionSlotLabel,
        /** Id khung giờ (time_slots) khách chọn → tăng current_bookings, kiểm soát bằng version. */
        Long timeSlotId,

        /** Id các dịch vụ add-on (isAddon=true) khách chọn kèm theo. */
        List<Long> addonServiceIds
) {
    public List<Long> addonServiceIds() {
        return addonServiceIds != null ? addonServiceIds : List.of();
    }
}


package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.constraints.NotNull;

/**
 * Một dịch vụ đặt cho thú cưng (tương ứng 1 bản ghi booking_pet_services).
 * Các bản ghi này sẽ chia sẻ cùng booking_id và booking_pet_id thông qua Booking / BookingPet.
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
        String sessionSlotLabel
) {
}


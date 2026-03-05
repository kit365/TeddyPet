package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;

public record CreateBookingPetRequest(
        @NotBlank(message = "Tên thú cưng là bắt buộc")
        String petName,

        @NotBlank(message = "Loại thú cưng là bắt buộc")
        String petType,

        BigDecimal weightAtBooking,

        String emergencyContactName,
        String emergencyContactPhone,

        String petConditionNotes,

        @NotEmpty(message = "Vui lòng chọn ít nhất một dịch vụ cho thú cưng")
        List<@Valid CreateBookingPetServiceRequest> services
) {
}


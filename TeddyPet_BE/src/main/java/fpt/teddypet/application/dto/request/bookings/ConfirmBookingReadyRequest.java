package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record ConfirmBookingReadyRequest(
        @NotEmpty(message = "Danh sách thú cưng không được để trống")
        @Valid
        List<PetConfirmInfo> pets
) {
    public record PetConfirmInfo(
            @NotNull(message = "ID thú cưng không được để trống")
            Long petId,
            
            @NotNull(message = "Loại thú cưng không được để trống")
            String petType,
            
            @NotNull(message = "Cân nặng thú cưng không được để trống")
            BigDecimal weightAtBooking
    ) {}
}

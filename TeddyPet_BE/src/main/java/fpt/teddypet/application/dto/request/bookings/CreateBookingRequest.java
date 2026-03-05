package fpt.teddypet.application.dto.request.bookings;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CreateBookingRequest(
        @NotBlank(message = "Tên khách hàng là bắt buộc")
        String customerName,

        @NotBlank(message = "Email là bắt buộc")
        @Email(message = "Email không hợp lệ")
        String customerEmail,

        @NotBlank(message = "Số điện thoại là bắt buộc")
        String customerPhone,

        String customerAddress,

        String note,

        /**
         * Loại booking: HOTEL_DOG | HOTEL_CAT | SPA_CARE...
         * Tạm thời client đang gửi SPA_CARE.
         */
        @NotBlank(message = "Loại đặt lịch là bắt buộc")
        String bookingType,

        @NotEmpty(message = "Vui lòng chọn ít nhất một thú cưng và dịch vụ")
        List<@Valid CreateBookingPetRequest> pets
) {
}


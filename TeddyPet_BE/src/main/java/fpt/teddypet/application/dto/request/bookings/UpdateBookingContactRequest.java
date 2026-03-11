package fpt.teddypet.application.dto.request.bookings;

import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateBookingContactRequest(
                @NotBlank(message = "Họ tên không được để trống") String customerName,

                @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String customerEmail,

                @NotBlank(message = "Số điện thoại không được để trống") String customerPhone,

                String customerAddress,

                List<UpdateBookingPetRequest> pets) {

        public record UpdateBookingPetRequest(
                        Long id,
                        String petName,
                        String emergencyContactName,
                        String emergencyContactPhone) {
        }
}

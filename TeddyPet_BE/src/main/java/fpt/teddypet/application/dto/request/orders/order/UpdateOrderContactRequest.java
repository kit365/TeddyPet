package fpt.teddypet.application.dto.request.orders.order;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateOrderContactRequest(
        @Size(max = 500, message = "Địa chỉ quá dài (tối đa 500 ký tự)") String shippingAddress,

        @Email(message = "Email không đúng định dạng")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String guestEmail) {
}


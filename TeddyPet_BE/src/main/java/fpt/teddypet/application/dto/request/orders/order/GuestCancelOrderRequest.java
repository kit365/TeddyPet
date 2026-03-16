package fpt.teddypet.application.dto.request.orders.order;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GuestCancelOrderRequest(
        @NotBlank(message = "Mã đơn hàng không được để trống") String orderCode,
        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email,
        @NotBlank(message = "Lý do hủy không được để trống") @Size(min = 5, max = 500, message = "Lý do hủy phải từ 5 đến 500 ký tự") String reason) {
}
